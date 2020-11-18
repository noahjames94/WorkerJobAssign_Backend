import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ObjectID, ObjectIdColumn
} from "typeorm";
import { ApplicationEntity } from "./applicationEntity";
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsMilitaryTime,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { DEPARTMENTS, JobType, searchDepartmentById } from "@constants";
import EnumHelper from "../utils/enumHelper";
import * as path from "path";
import { Timesheet } from "./timesheet";
import { MongoHelper } from "../main";
import TemplateHelper from "../utils/TemplateHelper";
import { Exclude, Expose, Transform } from "class-transformer";
import { INVOICE } from "../constants/invoice";
import { toHexString } from "../commons";

const fs = require("fs");
const conversionFactory = require("html-to-xlsx"); // https://jsreport.net/learn/html-to-xlsx
const puppeteer = require("puppeteer");
const chromeEval = require("chrome-page-eval")({ puppeteer, launchOptions: { headless: true, args: ['--no-sandbox'] } });
const { ObjectId } = require("mongodb").ObjectId;
const conversion = conversionFactory({
  extract: chromeEval
});

export enum PRICING_TYPE {
  FLAT,
  HOURLY,
  MIXED
}
export enum BILLING_CYCLE {
  WEEKLY,
  MONTHLY,
  DAILY
}

@Entity()
export class Invoice extends ApplicationEntity {
  static tableName = "invoice";

  @Column()
  @ValidateNested({ each: true })
  @IsArray()
  @ArrayNotEmpty()
  pricing: Array<Pricing>;

  @Column()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(DEPARTMENTS.map(d => +d.id), { each: true })
  departments: number[];

  departmentNames?: string[];

  @Column()
  @IsIn(new EnumHelper(BILLING_CYCLE).values)
  billingCycle: BILLING_CYCLE;

  @Column()
  @IsDateString()
  date: Date;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  useActualBreakTimes: boolean;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  onlyCompleted: boolean;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  ignoreBreaks: boolean;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  forceBreakValue: boolean;

  @ValidateIf(invoice => (invoice.forceBreakValue === true))
  @IsNotEmpty()
  @IsMilitaryTime()
  forceBreakTime: string;

  @Column()
  @IsNotEmpty()
  @IsArray()
  emails: string[];

  @Column()
  @IsNotEmpty()
  @IsArray()
  timesheetsIds: ObjectID[];

  timesheets?: Timesheet[];

  paid?: string;
  po?: string;
  totalAmount?: number;

  @Column()
  moved: boolean = false;

  @AfterLoad()
  async afterLoad() {
    this.departmentNames = this.departments.map(department => {
      const dIndex = DEPARTMENTS.findIndex(_deparment => _deparment.id === department);
      if (dIndex !== -1) {
        return DEPARTMENTS[dIndex].name;
      }
    });
  }

  @BeforeInsert()
  async beforeInsert() {
    const jobTypes: Array<JobType> = this.pricing.map((pricing) => {
      return pricing.jobType as JobType;
    });
    if (!this.timesheetsIds || !this.timesheetsIds.length) {
      this.timesheetsIds = ((await Invoice.findTimesheets({ ...this, jobTypes })).map(timesheet => {
        return timesheet._id;
      }));
    }
  }

  @AfterInsert()
  async afterInsert() {
    await MongoHelper.connect();
    const collection = MongoHelper.getCollection("timesheet");
    return await collection.updateMany({ _id: { $in: this.timesheetsIds } }, {
      $set: { invoiceId: this.id }
    });
  }

  @BeforeUpdate()
  async beforeUpdate() {
    const jobTypes: Array<JobType> = this.pricing.map(pricing => {
      return pricing.jobType as JobType;
    });
    this.timesheetsIds = ((await Invoice.findTimesheets({ ...this, jobTypes })).map(timesheet => {
      return timesheet.id;
    }));
  }

  @AfterUpdate()
  async afterUpdate() {
    await MongoHelper.connect();
    const collection = MongoHelper.getCollection("timesheet");
    await collection.updateMany({ invoiceId: this.id }, {
      // tslint:disable-next-line:no-null-keyword
      invoiceId: null
    });
    return await collection.updateMany({ _id: { $in: this.timesheetsIds } }, {
      $set: { invoiceId: this.id }
    });
  }


  async loadTimesheetsSummary() {
    const _timesheets = await this.getRepository(Timesheet).findByIds(this.timesheetsIds || []);
    const timesheets = [];
    for (let i = 0; i < _timesheets.length; i++) {
      timesheets.push(await _timesheets[i].invoiceView(this, true));
    }
    const res = {} as any;
    res.totals = timesheets.reduce((a, b) => {
      return {
        regHrs: a.regHrs + b.regularHours,
        totalRegHrs: a.totalRegHrs + +b.regularAmount,
        otHrs: a.otHrs + b.overtimeHours,
        totalOtHrs: a.totalOtHrs + +b.overtimeAmount,
        holHrs: a.holHrs + b.holidayHours,
        totalHolHrs: a.totalHolHrs + +b.holidayAmount,
        paid: a.paid + (b.paid ? 1 : 0),
        po: a.po + (b.po ? 1 : 0),
        totalAmount: a.totalAmount + +b.totalAmount
      };
    }, { regHrs: 0, totalRegHrs: 0, otHrs: 0, totalOtHrs: 0, holHrs: 0, totalHolHrs: 0, totalAmount: 0, paid: 0, po: 0 });
    res.timesheets = timesheets;
    return res;
  }

  static async findTimesheets(params: any) {
    const { date, billingCycle, departments, jobTypes } = params;
    const _date = new Date(params.date);
    switch (billingCycle) {
      case BILLING_CYCLE.DAILY:
        _date.setDate(_date.getDate() + 1);
        break;
      case BILLING_CYCLE.MONTHLY:
        _date.setDate(_date.getDate() + 30);
        break;
      case BILLING_CYCLE.WEEKLY:
        _date.setDate(_date.getDate() + 7);
        break;
    }
    const query = [
      {
        // tslint:disable-next-line:no-null-keyword
        $match: { finishDate: { $lt: _date.toISOString(), $gte: date.toISOString() }, invoiceId: null as any }
      },
      {
        $lookup:
        {
          from: "job",
          localField: "jobId",
          foreignField: "_id",
          as: "jobs"
        }
      },
      {
        $match: { jobs: { $elemMatch: { department: { $in: departments }, jobType: { $in: jobTypes } } } }
      },
      { $project: { jobs: 0 } }
    ];
    await MongoHelper.connect();
    const collection = MongoHelper.getCollection("timesheet");
    return (await collection.aggregate(query).toArray());
  }
  async loadReportTimesheets() {
    const query = [
      {
        $match: { _id: { $in: this.timesheetsIds.map(id => ObjectId(id)) } }
      },
      {
        $lookup:
        {
          from: "job",
          localField: "jobId",
          foreignField: "_id",
          as: "jobs"
        }
      },
      { $project: { jobs: 0 } }
    ];
    await MongoHelper.connect();
    const collection = MongoHelper.getCollection("timesheet");
    const _timesheetsIds = [] as any;
    (await collection.aggregate(query).toArray()).map((timesheet: any) => {
      _timesheetsIds.push(ObjectId(timesheet._id));
    });
    const timesheets = await this.getRepository(Timesheet).find({ _id: { $in: _timesheetsIds || [] } } as any);
    const result = {
      timesheets: {} as any,
      departmentType: searchDepartmentById(this.departments[0]).group || 0
    };
    const results = [] as any;
    for (let i = 0; i < timesheets.length; i++) {
      const timesheet = new Timesheet(timesheets[i]);
      results.push(await timesheet.invoiceView(this));
    }
    results.map((_timesheet: any) => {
      if (!result.timesheets[_timesheet.type]) {
        result.timesheets[_timesheet.type] = [] as any;
      }
      result.timesheets[_timesheet.type].push(_timesheet);
    });
    return result;
  }

  @Expose()
  get endDate() {
    const _date = new Date(this.date);
    switch (this.billingCycle) {
      case BILLING_CYCLE.DAILY:
        _date.setDate(_date.getDate() + 1);
        break;
      case BILLING_CYCLE.MONTHLY:
        _date.setDate(_date.getDate() + 30);
        break;
      case BILLING_CYCLE.WEEKLY:
        _date.setDate(_date.getDate() + 7);
        break;
    }
    return _date;
  }

  async loadExcelInvoice() {
    const fpath = path.join(process.cwd(), `/storage/invoice-${this.id.toString()}.xlsx`);
    try {
      if (fs.existsSync(fpath)) {
        return fpath;
      }
    } catch (err) {
      console.error(err);
    }
    let html = fs.readFileSync(path.join(process.cwd(), "/src/templates/invoice.html"), "utf8");
    const _data = await this.loadReportTimesheets();
    let sheets = "";
    for (const [type, _timesheets] of Object.entries(_data.timesheets)) {
      let sheetName = (_timesheets as Array<any>)[0].department + " - ";
      switch (+type) {
        case JobType.Flagging:
          sheetName += "Flagging";
          break;
        case JobType.Parking:
          sheetName += "Parking";
          break;
        case JobType.Signage:
          sheetName += "Signage";
          break;
      }
      let sheet = `<table data-sheet-name="${sheetName}">`;
      sheet += fs.readFileSync(path.join(process.cwd(), `/src/templates/invoice/invoice-${_data.departmentType}.html`), "utf8");
      (_timesheets as Array<any>).map((_timesheet: any) => {
        const html = fs.readFileSync(path.join(process.cwd(), `/src/templates/invoice/raws/invoice-${_data.departmentType}-item-raw.html`), "utf8");
        sheet += TemplateHelper.loadParams(html, _timesheet);
      });
      sheet += "</table>";
      sheets += sheet;
    }
    html = TemplateHelper.loadParams(html, { reports: sheets });
    const stream = await conversion(html);
    return (await stream.pipe(fs.createWriteStream(fpath))).path;
  }

  public static async createScheduleInvoices(checkCycle: boolean = false) {
    const now = new Date();
    for (let i = 0; i < INVOICE.length; i++) {
      const _invoice = INVOICE[i];
      if (checkCycle && _invoice.cycle == BILLING_CYCLE.MONTHLY && now.getDate() != 1) { // Every 1 for monthly
        continue;
      }
      if (checkCycle && _invoice.cycle == BILLING_CYCLE.WEEKLY && now.getDay() != 1) { // Every monday for weekly
        continue;
      }
      const _date = new Date(now.toISOString());
      switch (_invoice.cycle) {
        case BILLING_CYCLE.DAILY:
          _date.setDate(_date.getDate() - 1);
          break;
        case BILLING_CYCLE.MONTHLY:
          _date.setDate(_date.getDate() - 30);
          break;
        case BILLING_CYCLE.WEEKLY:
          _date.setDate(_date.getDate() - 7);
          break;
      }
      const _timesheets = await Invoice.findTimesheets({
        date: _date, billingCycle: _invoice.cycle,
        departments: _invoice.departments, jobTypes: _invoice.jobTypes
      });
      if (!_timesheets.length) {
        continue;
      }
      const pricings = _invoice.jobTypes.map(_type => {
        return {
          jobType: _type,
          type: 1,
          flatRate: 0,
          straightHoursRate: 0,
          otHoursRate: 0,
          holidayHoursRate: 0
        };
      });
      const entity = await new Invoice();
      entity.assignAttributes({
        pricing: pricings,
        departments: _invoice.departments,
        billingCycle: _invoice.cycle,
        date: _date.toISOString(),
        useActualBreakTimes: false,
        onlyCompleted: true,
        ignoreBreaks: true,
        forceBreakValue: true,
        forceBreakTime: "00:00",
        paid: false,
        emails: [],
        timesheetsIds: _timesheets.map(timesheet => {
          return timesheet._id;
        })
      }, []);
      await entity.validate();
      await entity.save();

      for (let j = 0; j < _timesheets.length; j++) {
        _timesheets[j].invoiceId = entity.id;
        await _timesheets[j].save();
      }
    }
  }
}

export class Pricing implements IPricing {
  @IsNotEmpty()
  @IsNumber()
  @IsIn(new EnumHelper(JobType).values)
  jobType: JobType;

  @IsNotEmpty()
  @IsNumber()
  @IsIn(new EnumHelper(PRICING_TYPE).values)
  type: PRICING_TYPE;

  @ValidateIf(pricing => (pricing.type === PRICING_TYPE.FLAT || pricing.type === PRICING_TYPE.MIXED))
  @IsNotEmpty()
  @IsNumber()
  flatRate: number;

  @ValidateIf(pricing => (pricing.type === PRICING_TYPE.HOURLY || pricing.type === PRICING_TYPE.MIXED))
  @IsNotEmpty()
  @IsNumber()
  straightHoursRate: number;

  @ValidateIf(pricing => (pricing.type === PRICING_TYPE.HOURLY || pricing.type === PRICING_TYPE.MIXED))
  @IsNotEmpty()
  @IsNumber()
  otHoursRate: number;

  @ValidateIf(pricing => (pricing.type === PRICING_TYPE.HOURLY || pricing.type === PRICING_TYPE.MIXED))
  @IsNotEmpty()
  @IsNumber()
  holidayHoursRate: number;
}

interface IPricing {
  jobType: JobType;
  type: PRICING_TYPE;
  flatRate?: number;
  straightHoursRate?: number;
  otHoursRate?: number;
  holidayHoursRate?: number;
}
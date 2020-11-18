import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
  IsOptional
} from "class-validator";
import {
  AfterInsert,
  AfterLoad, AfterUpdate,
  BeforeInsert, BeforeUpdate,
  Column,
  Entity,
  getMongoRepository, ObjectID, ObjectIdColumn
} from "typeorm";

import { ApplicationEntity } from "./applicationEntity";
import { Exclude, Expose, Transform } from "class-transformer";
import { Location } from "./location";
import { Comment } from "./comment";
import { Job } from "./job";

import {
  DEPARTMENT_GROUPS,
  DEPARTMENTS,
  flaggingPrices,
  JobType,
  parkingPrices,
  searchDepartmentById,
  signagePrices,
  JobStatus
} from "@constants";

import { User } from "./user";
import * as path from "path";
import { DateTime } from "../utils/dateTime/dateTime";
import EnumHelper from "../utils/enumHelper";
import { WorkerJobStatus } from "./jobWorker";
import { Invoice } from "./invoice";
import { toHexString } from "../commons";
import { Municipality } from "./municipality";
import { isHoliday } from "../constants/holidays";
const { ObjectId } = require("mongodb").ObjectId;
import { ObjectID as OId } from "mongodb";
import moment = require("moment");
import TemplateHelper from "../utils/TemplateHelper";
import { MongoHelper } from "../main";

const fs = require("fs");
const pdf = require("html-pdf");

const OVERTIME_HOURS = 6;
const OVERTIME_HOURS_INCREASE = 30;

@Entity()
export class Timesheet extends ApplicationEntity {
  static tableName = "timesheet";

  @Column()
  @IsNotEmpty()
  @IsString()
  workerId: string;

  @Column()
  @IsOptional()
  @Expose()
  @IsNumber()
  electric: number;

  @Column()
  @IsOptional()
  @Expose()
  @IsNumber()
  gas: number;

  @Column()
  @IsNotEmpty()
  @ValidateNested()
  locations: Location;

  @Column()
  @Expose()
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @Column()
  @Expose()
  @IsDateString()
  @IsNotEmpty()
  finishDate: Date;

  @Column()
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  totalHours: number;

  @Column()
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  hasLunch: boolean;

  @Column()
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  hasDinner: boolean;

  @Column()
  @Expose()
  @IsBoolean()
  @IsNotEmpty()
  noBreak: boolean;

  @Column()
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  conEdisonTruck: number;

  @Column()
  @IsOptional()
  @Expose()
  @IsString()
  conEdisonSupervisor: string;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  paid: boolean;

  @Column()
  @IsOptional()
  @Expose()
  @IsArray()
  @ValidateNested()
  comments: Comment[];

  @Column()
  @Transform(toHexString, { toPlainOnly: true })
  invoiceId?: OId;

  invoice?: Invoice;

  @Column()
  sign: string;

  @Column()
  @IsNotEmpty()
  @Transform(toHexString, { toPlainOnly: true })
  jobId: OId;

  requestorName?: string;
  requestDate?: Date;
  jobFinishTime?: Date;
  requestor?: string;
  department?: number;
  departmentName?: string;
  confirmationNumber?: number;
  conEdisonSupervisorName?: string;
  section?: string;
  account?: number;
  workRequest?: number;
  po?: number;
  jobComment?: string;
  type?: JobType;
  worker?: User;
  municipality?: Municipality;

  @Column()
  overtimeHours: number;
  @Column()
  holidayHours: number;
  @Column()
  regHours: number;

  @BeforeInsert()
  async beforeInsert() {
    await this.loadHours();
    this.jobId = ObjectId(this.jobId);
  }

  @BeforeUpdate()
  async beforeUpdate() {
    await MongoHelper.connect();
    const collection = MongoHelper.getCollection("job");
    const job = new Job(await collection.findOne(this.jobId));
    if (job && job.jobStatus !== JobStatus.Cancelled) {
      await this.loadHours();
    }

  }

  @AfterUpdate()
  async afterUpdate() {
    const invoiceId = await this.assignToInvoice();
    if (invoiceId) {
      this.invoiceId = ObjectId(invoiceId);
    }
  }

  @AfterInsert()
  async afterInsert() {
    const invoiceId = await this.assignToInvoice();
    if (invoiceId) {
      this.invoiceId = ObjectId(invoiceId);
    }
  }

  @AfterLoad()
  async afterLoad() {
    if (this.conEdisonSupervisor) {
      const supervisor = await this.getRepository(User).findOne(this.conEdisonSupervisor);
      if (supervisor) {
        this.conEdisonSupervisorName = supervisor.name;
      }
    }

    await this.loadJobParams();
    if (!this.totalHours) {
      await this.loadHours();
      if (this.overtimeHours > 0 || this.holidayHours > 0 || this.totalHours > 0) {
        this.save();
      }
    }
  }

  async assignToInvoice() {
    const invoiceRepository = this.getRepository(Invoice);
    const oldInvoices = await invoiceRepository.find({ timesheetsIds: ObjectId(this.id) });
    for (let i = 0; i < oldInvoices.length; i++) {
      oldInvoices[i].timesheetsIds = oldInvoices[i].timesheetsIds.filter((_id) => _id.toString() !== this.id.toString());
      await getMongoRepository(Invoice).updateOne({ _id: ObjectId(oldInvoices[i].id) }, { $set: { timesheetsIds: oldInvoices[i].timesheetsIds } });
    }
    const query = {
      date: { $lt: this.finishDate },
      departments: this.department,
      pricing: { $elemMatch: { jobType: this.type } },
      $where: "function() {" +
        "var _date = new Date(this.date);" +
        "switch (this.billingCycle) {" +
        "      case 2:" +
        "        _date.setDate(_date.getDate() + 1);" +
        "        break;" +
        "      case 1:" +
        "        _date.setDate(_date.getDate() + 30);" +
        "        break;" +
        "      case 0:" +
        "        _date.setDate(_date.getDate() + 7);" +
        "        break;" +
        "    }" +
        "return _date.getTime() > " + new Date(this.finishDate).getTime() +
        "}"
    };
    const invoice = await invoiceRepository.findOne(query as any);
    if (invoice) {
      if (!invoice.timesheetsIds) invoice.timesheetsIds = [];
      invoice.timesheetsIds.push(ObjectId(this.id));
      await getMongoRepository(Invoice).updateOne({ _id: ObjectId(invoice.id) }, { $set: { timesheetsIds: invoice.timesheetsIds } });
    }
    return (invoice ? invoice.id : undefined);
  }

  async loadJobParams() {
    await MongoHelper.connect();
    const collection = MongoHelper.getCollection("job");
    const job = new Job(await collection.findOne(this.jobId));
    if (job) {
      this.requestorName = job.requestorName;
      this.requestor = job.requestor;
      this.requestDate = job.requestTime;
      this.jobFinishTime = job.endTime;
      this.department = job.department;
      this.departmentName = job.departmentName;
      this.department = job.department;
      this.confirmationNumber = job.confirmationNumber;
      this.section = job.section;
      this.account = job.account;
      this.workRequest = 1; // @ToDo: Change this
      this.municipality = job.municipality; // @ToDo: Change this
      this.po = job.po;
      this.type = job.jobType;
      this.jobComment = job.comment;
    }
    this.worker = await this.getRepository(User).findOne(this.workerId);
  }

  private async loadHours() {
    console.log(this.totalHours, this.totalH);
    this.totalHours = this.worker ? +this.totalH : 0;
    this.overtimeHours = this.worker ? +this.otH : 0;
    this.holidayHours = this.worker ? +this.holH : 0;
    this.regHours = this.worker ? +this.regularHours : 0;
    console.log(this.totalHours, this.totalH);
  }

  async getPdfReport(): Promise<string> {
    const fpath = path.join(process.cwd(), `/storage/timesheet-${this.id.toString()}.pdf`);
    try {
      if (fs.existsSync(fpath)) {
        return fpath;
      }
    } catch (err) {
      console.error(err);
    }
    await this.loadJobParams();
    let html = fs.readFileSync(path.join(process.cwd(), "/src/templates/timesheet.html"), "utf8");

    const reqDate = new DateTime(this.requestDate);
    const startDate = new DateTime(this.startDate);
    const finishDate = new DateTime(this.finishDate);

    const params = {
      "codeNumber": this.uid,
      "requestor": this.requestorName,
      "requestDate": reqDate.date,
      "requestTime": `${reqDate.hours}:${reqDate.minutes}`,
      "requested": "",
      "electric": this.electric,
      "gas": this.gas,
      "sectionNum": this.section,
      "accountNum": this.account,
      "workRequestNum": this.workRequest,
      "po": this.po,
      "flagger": new EnumHelper(JobType).keys[this.type],
      "confirmation": this.confirmationNumber,
      "startDate": startDate.date,
      "startTime": `${startDate.hours}:${startDate.minutes}`,
      "lunch": this.hasLunch ? "x" : "  ",
      "dinner": this.hasDinner ? "x" : "  ",
      "noBreak": this.noBreak ? "x" : "  ",
      "finishDate": finishDate.date,
      "finishTime": `${finishDate.hours}:${finishDate.minutes}`,
      "totalHours": this.totalHours,
      "conEdisonTruck": this.conEdisonTruck,
      "conEdisonSupervisor": this.conEdisonSupervisor,
    } as any;
    params[`location1`] = this.locations.address;
    html = TemplateHelper.loadParams(html, params);
    const options = {
      format: "Letter", "border": { left: "2.54cm", right: "2.54cm" },
      orientation: "landscape",
      height: "21.59cm", width: "27.94cm"
    };
    return await new Promise((resolve, reject) =>
      pdf.create(html, options).toFile(fpath, function (err: any, res: any) {
        if (err) return reject(err);
        return resolve(fpath);
      }));
  }

  static async buildSearchQuery(params: any) {
    const query = {} as any;
    if (params.page) {
      query.page = params.page;
    }
    if (params.worker) {
      query.workerId = params.worker;
    }
    if (params.jobId) {
      query.jobId = ObjectId(params.jobId);
    }
    if (params.confirmation || params.po) {
      const jobQuery = {} as any;
      if (params.confirmation && !isNaN(params.confirmation)) {
        jobQuery.tableId = (+params.confirmation - Job.confirmationCode - 1);
      }
      if (params.po && !isNaN(params.po)) {
        jobQuery.$where = `/${params.po}/.test(this.po)`;
      }
      const jobIds = (await getMongoRepository(Job).find(jobQuery))
        .map((job: Job) => {
          return job.id;
        });
      if (query.jobId) {
        query.$or = [{ jobId: { $in: jobIds } }, { jobId: query.jobId }];
        delete query.jobId;
      } else {
        query.jobId = { $in: jobIds };
      }
    }
    return query;
  }

  async workerView(userId: any): Promise<any> {
    const job = await getMongoRepository(Job).findOne(ObjectId(this.jobId));
    if (!job) {
      return undefined;
    }
    const workerIndex = job.workers.findIndex(worker => worker.workerId === userId.toString());
    if (workerIndex === -1) {
      return undefined;
    }
    const TSheetStart = new DateTime(this.startDate);
    const TSheetFinish = new DateTime(this.finishDate);
    return {
      ...job.workerView(job.workers[workerIndex]),
      timesheetId: this.id,
      workerStatus: WorkerJobStatus.REVIEW,
      startDate: TSheetStart.date,
      startTime: `${TSheetStart.hours}:${TSheetStart.minutes}`,
      finishDate: TSheetFinish.date,
      finishTime: `${TSheetFinish.hours}:${TSheetFinish.minutes}`,
      totalHours: DateTime.getTimeDiff(this.finishDate, this.startDate),
      conEdisonTruck: this.conEdisonTruck,
      hasDinner: this.hasDinner,
      hasLunch: this.hasLunch,
      noBreak: this.noBreak
    };
  }

  async invoiceView(invoice: Invoice, defaultView: boolean = false) {
    await this.loadJobParams();
    if (defaultView) {
      return this.defaultView();
    }
    const departmentGroup = searchDepartmentById(this.department)?.group;

    switch (departmentGroup) {
      case DEPARTMENT_GROUPS.CONSTRUCTION_SERVICE_GROUP:
        return { ...this.constructionServiceView(), departmentGroup };
      case DEPARTMENT_GROUPS.ELECTRIC_GROUP:
        return { ...this.electricServiceView(), departmentGroup };
      case DEPARTMENT_GROUPS.GAS_PRESSURE_CONTROL_GROUP:
        return { ...this.gasPressureView(), departmentGroup };
      case DEPARTMENT_GROUPS.TRANSMISSION_SERVICE:
        return { ...this.transmissionServiceView(), departmentGroup };
      case undefined:
        return { ...this.transmissionServiceView() };
    }
  }

  private constructionServiceView() {
    const reqDate = new DateTime(this.requestDate);
    return {
      confirmationNumber: this.confirmationNumber,
      startDateTime: this.startDate,
      endDateTime: this.finishDate,
      requestDate: reqDate.date,
      requestor: this.requestorName,
      department: this.departmentName,
      po: this.po,
      jobId: this.jobId,
      location: this.locations,
      totalHours: this.totalHours,
      billableHours: (!this.noBreak && this.totalHours >= 6) ? (this.totalHours + 0.5).toFixed(2) : this.totalHours,
      strTime: this.regularHours,
      strTimeAmount: this.regAmount.toFixed(2),
      overtimeHours: this.overtimeHours,
      overtimeAmount: this.otAmount.toFixed(2),
      emrTime: this.holidayHours,
      emrAmount: this.holAmount.toFixed(2),
      totalAmount: this.amount.toFixed(2),
      type: this.type,
    };
  }

  private electricServiceView() {
    const reqDate = new DateTime(this.requestDate);
    return {
      dateOfService: reqDate.date,
      department: this.departmentName,
      section: this.section,
      po: this.po,
      jobId: this.jobId,
      billed: this.paid,
      ticketNumber: this.confirmationNumber,
      requestor: this.requestorName,
      requestTime: `${reqDate.hours}:${reqDate.minutes}`,
      supervisor: this.conEdisonSupervisor,
      ticketNum: 0, // @ToDo change
      location: this.locations,
      muni: this.municipality,
      flaggerName: this.worker.name, // @ToDo change
      flaggerEmploe: this.worker.uid, // @ToDo change
      tsReceived: 0, // @ToDo change
      startDateTime: this.startDate,
      endDateTime: this.finishDate,
      breakTaken: !this.noBreak,
      totalHours: this.totalHours,
      regularHours: this.regularHours,
      overtimeHours: this.overtimeHours,
      holidayHours: this.holidayHours,
      totalAmount: this.amount.toFixed(2),
      type: this.type,
    };
  }

  private gasPressureView() {
    const reqDate = new DateTime(this.requestDate);
    const startDateTime = new DateTime(this.startDate);
    return {
      startDateTime: this.startDate,
      endDateTime: this.finishDate,
      requestDate: reqDate.date,
      jobStartDate: startDateTime.date,  // @ToDo change
      department: this.departmentName,
      supervisor: this.conEdisonSupervisor,
      ticketNum: 0, // @ToDo change
      conedTicketNumber: 0, // @ToDo change
      confNumber: this.confirmationNumber,
      requisition: 0, // @ToDo change
      order: 0, // @ToDo change
      receipted: 0, // @ToDo change
      requestor: this.requestorName,
      timesheetNum: this.uid,
      pa: this.po, // @ToDo change
      jobId: this.jobId,
      location: this.locations,
      additionalLocations: [] as any,
      worker: this.worker,
      remarks: this.comments || [],
      conedRemarks: this.jobComment || [] as any,
      totalHours: this.totalHours,
      billableHours: (!this.noBreak && this.totalHours >= 6) ? (this.totalHours + 0.5).toFixed(2) : this.totalHours,
      strTime: this.regularHours,
      strTimeAmount: this.regAmount.toFixed(2),
      overtimeHours: this.overtimeHours,
      overtimeAmount: this.otAmount.toFixed(2),
      emrTime: this.holidayHours,
      emrAmount: this.holAmount.toFixed(2),
      totalAmount: this.amount.toFixed(2),
      paid: this.paid,
      serviceType: this.type,
      type: this.type,
    };
  }

  private transmissionServiceView() {
    const reqDate = new DateTime(this.requestDate);
    const startDateTime = new DateTime(this.startDate);
    return {
      requestDate: reqDate.date,
      jobStartDate: startDateTime.date,  // @ToDo change
      department: this.departmentName,
      location: this.locations,
      emrNumber: this.confirmationNumber,
      remarks: this.comments || [],
      jobId: this.jobId,
      totalHours: this.totalHours,
      billableHours: (!this.noBreak && this.totalHours >= 6) ? (this.totalHours + 0.5).toFixed(2) : this.totalHours,
      strTime: this.regularHours,
      strTimeAmount: this.regAmount.toFixed(2),
      overtimeHours: this.overtimeHours,
      overtimeAmount: this.otAmount.toFixed(2),
      emrTime: this.holidayHours,
      emrAmount: this.holAmount.toFixed(2),
      totalAmount: this.amount.toFixed(2),
      type: this.type,
    };
  }

  private defaultView() {
    const reqDate = new DateTime(this.requestDate);
    return {
      uid: this.uid + 1, // @ToDo change
      dateOfService: reqDate.date, // @ToDo change
      department: this.departmentName,
      section: this.section,
      po: this.po,
      jobId: this.jobId,
      paid: this.paid,
      ticketNum: 0, // @ToDo change
      requestor: this.requestorName,
      requestTime: `${reqDate.hours}:${reqDate.minutes}`,
      supervisor: this.conEdisonSupervisor,
      conedJobTicket: "", // @ToDo change
      location: this.locations,
      muni: this.municipality,
      flaggerName: this.worker.name, // @ToDo change
      flaggerEmploe: this.worker.uid, // @ToDo change
      startDateTime: this.startDate,
      endDateTime: this.finishDate,
      breakTaken: !this.noBreak,
      totalHours: this.totalHours,
      billableHours: (!this.noBreak && this.totalHours >= 6) ? (this.totalHours + 0.5).toFixed(2) : this.totalHours,
      regularHours: this.regularHours,
      overtimeHours: this.overtimeHours,
      holidayHours: this.holidayHours,
      type: this.type,
      totalAmount: this.amount.toFixed(2),

      overtimeAmount: this.otAmount.toFixed(2),
      holidayAmount: this.holAmount.toFixed(2),
      regularAmount: this.regAmount.toFixed(2)
    } as any;
  }

  @Exclude()
  get otH(): number {
    const { startDate, endDate } = this.realWorkTime();
    const dates = DateTime.rangeDates(startDate, endDate);
    let hours = 0;
    dates.forEach(date => {
      if (isHoliday(date)) {
        return;
      }
      const finalDiff = this.workerWorkedHours(date) - 8;
      if (finalDiff > 0) {
        hours += finalDiff;
      }
    });
    return +hours.toFixed(2);
  }

  @Exclude()
  get holH(): number {
    const { startDate, endDate } = this.realWorkTime();
    const dates = DateTime.rangeDates(startDate, endDate);
    let hours = 0;
    dates.forEach(date => {
      if (!isHoliday(date)) {
        return;
      }
      hours += this.workerWorkedHours(date);
    });
    return +hours.toFixed(2);
  }

  @Exclude()
  workerWorkedHours(date: Date): number {
    const { startDate, endDate } = this.realWorkTime();
    const jobStartTime = moment(startDate);
    const jobEndTime = moment(endDate);
    const currentDate = moment(date);
    return this.worker.workingHours.reduce((hours, workingHour) => {
      const startTime = `${workingHour.begin.hour}:${workingHour.begin.minute}`;
      const endTime = `${workingHour.end.hour}:${workingHour.end.minute}`;

      const startWorkingHour = moment(`${startTime}:${currentDate.date()}:${currentDate.month() + 1}`, "hh:mm:DD:MM").add((-this.worker.timezone || 0), "hours");
      let endWorkingHour = moment(`${endTime}:${currentDate.date()}:${currentDate.month() + 1}`, "hh:mm:DD:MM").add((-this.worker.timezone || 0), "hours");
      if (endTime === "00:00") {
        endWorkingHour = endWorkingHour.add(1, "day");
      }

      const startTrack = jobStartTime.isAfter(startWorkingHour) ? jobStartTime : startWorkingHour;
      const endTrack = jobEndTime.isBefore(endWorkingHour) ? jobEndTime : endWorkingHour;
      if (startTrack.isAfter(endTrack)) return hours;

      // minutes time diff
      const _minutes = endTrack.diff(startTrack, "m") % 60;
      // time diff  in hr
      const _hours = endTrack.diff(startTrack, "h");

      const amount = _hours + (_minutes / 100);

      return DateTime.calculateOffset(hours, amount);
    }, 0);
  }

  @Exclude()
  get regularHours(): number {
    return (this.totalHours - this.overtimeHours - this.holH);
  }

  @Exclude()
  get amount(): number {
    return (this.otAmount + this.holAmount + this.regAmount);
  }

  @Exclude()
  private get otAmount(): number {
    let coef = 0;
    switch (this.type) {
      case JobType.Flagging:
        coef = flaggingPrices.ot;
        break;
      case JobType.Parking:
        coef = parkingPrices.ot;
        break;
      case JobType.Signage:
        coef = signagePrices.ot;
        break;
    }
    return coef * this.overtimeHours;
  }

  @Exclude()
  private get holAmount(): number {
    let coef = 0;
    switch (this.type) {
      case JobType.Flagging:
        coef = flaggingPrices.hol;
        break;
      case JobType.Parking:
        coef = parkingPrices.hol;
        break;
      case JobType.Signage:
        coef = signagePrices.hol;
        break;
    }
    return coef * this.holidayHours;
  }

  @Exclude()
  private get regAmount(): number {
    let coef = 0;
    switch (this.type) {
      case JobType.Flagging:
        coef = flaggingPrices.reg;
        break;
      case JobType.Parking:
        coef = parkingPrices.reg;
        break;
      case JobType.Signage:
        coef = signagePrices.reg;
        break;
    }
    return coef * (this.regularHours + ((!this.noBreak && this.totalHours >= 6) ? 0.5 : 0));
  }

  public get totalH(): number {
    const { startDate, endDate } = this.realWorkTime();
    const dates = DateTime.rangeDates(startDate, endDate);
    let hours = 0;
    const department = DEPARTMENTS.find(department => department.id === this.department);
    const otBreak = department && department.otBreak;


    dates.forEach(date => {
      let _hours = this.workerWorkedHours(date);
      if (otBreak && _hours > OVERTIME_HOURS) _hours += (OVERTIME_HOURS_INCREASE / 100);
      hours = DateTime.calculateOffset(hours, _hours);
    });

    const toNumbers = (hours: number) => {
      const ceil = Math.floor(hours);
      const minutes = hours - ceil;
      const part = 100 / (60 / minutes);
      return ceil + part;
    };

    const num = toNumbers(hours);

    return +num.toFixed(2);
  }

  private realWorkTime() {
    let startDate: Date;
    let endDate: Date;
    if (new Date(this.startDate).getTime() > new Date(this.requestDate).getTime()) {
      startDate = new Date(this.startDate);
    } else {
      startDate = new Date(this.requestDate);
    }
    if (!this.jobFinishTime || new Date(this.finishDate).getTime() < new Date(this.jobFinishTime).getTime()) {
      endDate = new Date(this.finishDate);
    } else {
      endDate = new Date(this.jobFinishTime);
    }

    return { startDate, endDate };
  }
}

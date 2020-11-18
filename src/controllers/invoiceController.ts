import * as express from "express";
import { injectable, inject } from "inversify";

import ApplicationController from "./applicationController";
import { SystemLogger } from "@loggers";
import { TYPES } from "@commons";
import { InvoiceRepositoryImpl, TimesheetRepositoryImpl } from "@repositories";
import { rescuable } from "@commons/decorators";
import { getCustomRepository } from "typeorm";
import passport from "passport";
import { Timesheet } from "../entities";
import { EROLES, searchDepartmentById } from "../constants";
import { BILLING_CYCLE } from "../entities/invoice";
import { MongoHelper } from "../main";
const { ObjectId } = require("mongodb").ObjectId;

@injectable()
export class InvoiceController extends ApplicationController {
  logger: SystemLogger;
  invoice: InvoiceRepositoryImpl;
  timesheet: TimesheetRepositoryImpl;

  constructor(@inject(TYPES.SystemLogger) _logger: SystemLogger) {
    super(_logger);
    this.invoice = getCustomRepository(InvoiceRepositoryImpl);
    this.timesheet = getCustomRepository(TimesheetRepositoryImpl);
  }

  register(app: express.Application): void {
    super.register(app);
    const router = express.Router();
    app.use("/invoices", router);

    router.route("/").post(passport.authenticate("jwt", { session: false }), this._add);
    router.route("/").get(this._findAll);
    router.route("/:id").get(this._find);
    router.route("/:id/timesheets/:jobType").get(this.timesheets);
    router.route("/:id/excel").get(this._excel);
  }

  @rescuable
  async _add(req: express.Request, res: express.Response, next: express.NextFunction) {
    // @ToDo: uncomment
    // const jobTypes: Array<JobType> = req.body.pricing.map((pricing: any) => {
    //     return pricing.jobType as JobType;
    // });
    if (!req.body.date) {
      const now = new Date(new Date(new Date().setHours(0)).setMinutes(0));
      switch (req.body.billingCycle) {
        case BILLING_CYCLE.DAILY:
          req.body.date = now.toISOString();
          break;
        case BILLING_CYCLE.WEEKLY:
          req.body.date = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString();
          break;
        case BILLING_CYCLE.MONTHLY:
          req.body.date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          break;
      }
    }
    // @ToDo: uncomment
    // if (!(await Invoice.findTimesheets({...req.body, jobTypes})).length) {
    //     res.status(400).send({ message: "There are no timesheets for selected date range" });
    //     return;
    // }
    res.send(await this.invoice.customCreate({ ...req.body, timesheetsIds: [] }));
  }

  @rescuable
  async _findAll(req: express.Request, res: express.Response, next: express.NextFunction) {
    const query = {} as any;
    console.log(req.query);
    if (req.query.invoiceDate) {
      query.$or = [{ date: { $gte: req.query.invoiceDate } }, { endDate: { $lte: req.query.invoiceDate } }];
    }
    if (req.query.departments) {
      query.departments = { $in: req.query.departments.map(Number) };
    }
    if (req.query.amount) {
      // @ToDo: Implement
    }
    if (req.query.po) {
      query.po = { $in: req.query.po };
    }
    if (req.query.paid) {
      query.paid = req.query.paid === "true";
    }
    if (req.query.billingCycle) {
      query.billingCycle = Number(req.query.billingCycle);
    }
    if (req.query.jobType && Array.isArray(req.query.jobType)) {
      query["pricing.jobType"] = { $in: req.query.jobType.map(Number) };
    }
    if (req.query.date) {
      query.date = req.query.date;
    }
    if (req.query.page) {
      query.page = req.query.page;
      req.query = { page: req.query.page };
    } else {
      req.query = {};
    }

    if (req.user && req.user.roles) {
      if (req.user.roles.includes(EROLES.coned_billing_admin) ||
        req.user.roles.includes(EROLES.requestor) ||
        req.user.roles.includes(EROLES.department_supervisor)) {
        if (!(
          req.user.roles.includes(EROLES.dispatcher) ||
          req.user.roles.includes(EROLES.dispatcher_supervisor) ||
          req.user.roles.includes(EROLES.billing) ||
          req.user.roles.includes(EROLES.superadmin)
        )) {
          const departments: any[] = req.user.departments;
          const departmentIds: any[] = departments.map(el => Number(el.id));
          query["department"] = { $in: departmentIds };
        }
      }
    }

    const invoices = await this.invoice.findAll(req, query);
    console.log(invoices.results[0]);
    for (let i = 0; i < invoices.results.length; i++) {
      const totals = await invoices.results[i].loadTimesheetsSummary();
      invoices.results[i].paid = `${totals.totals.paid}/${totals.timesheets.length}`;
      invoices.results[i].po = `${totals.totals.po}/${totals.timesheets.length}`;
      invoices.results[i].totalAmount = totals.timesheets.length;
    }
    res.send(invoices);
  }

  @rescuable
  async _find(req: express.Request, res: express.Response, next: express.NextFunction) {
    const { params: { id } } = req;
    const invoice = await this.invoice.findById(id.toString());
    const timesheets = await this.timesheet.findAllNoPaginate({ _id: { $in: invoice.timesheetsIds || [] } });
    const result = {
      timesheets: [] as any,
      endDate: invoice.endDate,
      startDate: invoice.date,
      departmentType: searchDepartmentById(invoice.departments[0]).group || 0
    };
    for (let i = 0; i < timesheets.length; i++) {
      const timesheet = new Timesheet(timesheets[i]);
      result.timesheets.push(await timesheet.invoiceView(invoice, true));
    }
    const data = {} as any;
    result.timesheets.forEach((timesheet: any) => {
      if (data[timesheet.type]) {
        data[timesheet.type].regularHours += +timesheet.regularHours;
        data[timesheet.type].regularAmount += +timesheet.regularAmount;
        data[timesheet.type].overtimeHours += +timesheet.overtimeHours;
        data[timesheet.type].overtimeAmount += +timesheet.overtimeAmount;
        data[timesheet.type].holidayHours += +timesheet.holidayHours;
        data[timesheet.type].holidayAmount += +timesheet.holidayAmount;
        data[timesheet.type].paid += (timesheet.paid ? 1 : 0);
        data[timesheet.type].po += (timesheet.po ? 1 : 0);
        data[timesheet.type].totalAmount += +timesheet.totalAmount;
        if (!data[timesheet.type].departments) {
          data[timesheet.type].deparments = new Array<string>();
        }
        if (!data[timesheet.type].departments.includes(timesheet.department)) {
          data[timesheet.type].departments.push(timesheet.department);
        }
      } else {
        data[timesheet.type] = {
          ...timesheet, po: (timesheet.po ? 1 : 0), paid: (timesheet.paid ? 1 : 0),
          departments: [timesheet.department] as any, regularAmount: +timesheet.regularAmount,
          totalAmount: +timesheet.totalAmount, overtimeAmount: +timesheet.overtimeAmount,
          holidayAmount: +timesheet.holidayAmount
        };
      }
    });
    result.timesheets = Object.values(data);
    result.timesheets = result.timesheets.map((timesheet: any) => {
      return {
        date: invoice.date,
        departments: timesheet.departments,
        jobType: timesheet.type,
        totalAmount: result.timesheets.length,
        pos: `${timesheet.po}/${result.timesheets.length}`,
        paid: `${timesheet.paid}/${result.timesheets.length}`,
        regular: timesheet.regularAmount,
        overtime: timesheet.overtimeAmount,
        holiday: timesheet.holidayAmount,
        total: timesheet.totalAmount,
      };
    });
    res.send(result);
  }

  @rescuable
  async timesheets(req: express.Request, res: express.Response, next: express.NextFunction) {
    const { params: { id, jobType } } = req;
    const invoice = await this.invoice.findById(id.toString());
    const query = [
      {
        $match: { _id: { $in: invoice.timesheetsIds.map(id => ObjectId(id)) } }
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
        $match: { jobs: { $elemMatch: { jobType: (+jobType === 3 ? { $in: [0, 1, 2] } : +jobType) } } }
      },
      { $project: { jobs: 0 } }
    ];
    await MongoHelper.connect();
    const collection = MongoHelper.getCollection("timesheet");
    const _timesheetsIds = [] as any;
    (await collection.aggregate(query).toArray()).map((timesheet: any) => {
      _timesheetsIds.push(ObjectId(timesheet._id));
    });
    const timesheets = await this.timesheet.findAll({ ...req, query: {} } as any, { _id: { $in: _timesheetsIds || [] } });
    const result = {
      timesheets: [] as any,
      endDate: invoice.endDate,
      startDate: invoice.date,
      departmentType: searchDepartmentById(invoice.departments[0]).group || 0
    };
    for (let i = 0; i < timesheets.results.length; i++) {
      const timesheet = new Timesheet(timesheets.results[i]);
      result.timesheets.push(await timesheet.invoiceView(invoice));
    }
    timesheets.results = result.timesheets;
    result.timesheets = timesheets;
    res.send(result);
  }

  @rescuable
  async _excel(req: express.Request, res: express.Response, next: express.NextFunction) {
    const { params: { id } } = req;
    const invoice = await this.invoice.findById(id.toString());
    if (!invoice) {
      res.status(404).send();
      return;
    }
    const file = await invoice.loadExcelInvoice();
    setTimeout(() => res.download(file), 3000);
  }
}

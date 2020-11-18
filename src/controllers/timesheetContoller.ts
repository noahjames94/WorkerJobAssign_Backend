import { TYPES } from "@commons";
import { rescuable } from "@commons/decorators";
import { SystemLogger } from "@loggers";
import express, { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { getCustomRepository } from "typeorm";
import multer = require("multer");
import ApplicationController from "./applicationController";
import passport from "passport";
import { JobRepositoryImpl, TimesheetRepositoryImpl, } from "@repositories";
import { EROLES, searchDepartmentById } from "../constants";
import { WorkerJobStatus } from "../entities/jobWorker";
import { Timesheet } from "../entities";
const { ObjectId } = require("mongodb").ObjectId;

@injectable()
export class TimesheetContoller extends ApplicationController {
  logger: SystemLogger;
  timesheet: TimesheetRepositoryImpl;
  job: JobRepositoryImpl;

  constructor(@inject(TYPES.SystemLogger) _logger: SystemLogger) {
    super(_logger);
    this.timesheet = getCustomRepository(TimesheetRepositoryImpl);
    this.job = getCustomRepository(JobRepositoryImpl);
  }

  register(app: express.Application, upload: multer.Instance): void {
    super.register(app);
    const router = express.Router();

    router.all("*", passport.authenticate("jwt", { session: false }));

    app.use("/timesheets", router);

    router.route("/").get(this.index);
    router.route("/:id/calculate-total").get(this.calcTotal);
    router.route("/").post(this.create);
    router.route(["/:id/pdf"]).get([], this._pdf);
    router.route("/:id").get(this.show);
    router.route("/:id/skip").put(this.updateSkipReason);
    router.route("/:id").put(upload.single("sign"), this.update);
    router.route("/:id/notify-supervisor").get(this.notifySupervisor);
  }

  @rescuable
  async index(req: Request, res: Response, next: NextFunction) {
    req.query = await Timesheet.buildSearchQuery(req.query);
    let isWorker = false;
    if (req.user.roles && req.user.roles.includes(EROLES.worker)) {
      req.query = { workerId: req.user.id.toString() };
      isWorker = true;
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
          req.query["department"] = { $in: departmentIds };
        }
      }
    }
    if (req.user && req.user.roles) {
      if (req.user.roles.includes(EROLES.coned_field_supervisor)) {
        if (!(
          req.user.roles.includes(EROLES.coned_billing_admin) ||
          req.user.roles.includes(EROLES.requestor) ||
          req.user.roles.includes(EROLES.department_supervisor) ||
          req.user.roles.includes(EROLES.dispatcher) ||
          req.user.roles.includes(EROLES.dispatcher_supervisor) ||
          req.user.roles.includes(EROLES.billing) ||
          req.user.roles.includes(EROLES.superadmin)
        )) {
          const jobRepository = getCustomRepository(JobRepositoryImpl);

          const jobs = await jobRepository.findAllNoPaginate({
            "supervisor": `${req.user.id}`
          });

          const jobIds: any[] = jobs.map(el => el.id);

          req.query["jobId"] = { $in: jobIds };
        }
      }
    }

    const result = [] as any;
    const found = await this.timesheet.findAll(req);

    if (!isWorker) {
      for (let i = 0; i < found.results.length; i++) {
        const timesheet = found.results[i];
        result.push({
          ...timesheet, worker: {
            avatar: timesheet.worker.avatar,
            name: timesheet.worker.name,
          }
        });
      }
      res.send({
        results: result,
        total: found.total,
        page: found.page,
        limit: found.limit
      });
      return;
    }
    for (let i = 0; i < found.results.length; i++) {
      const timesheet = found.results[i];
      const data = await timesheet.workerView(req.user.id);
      if (data) {
        result.push(data);
      }
    }
    res.send({
      results: result,
      total: found.total,
      page: found.page,
      limit: found.limit
    });
  }

  @rescuable
  async show(req: Request, res: Response, next: NextFunction) {
    const { params: { id } } = req;
    let isWorker = false;
    if (req.user.roles && req.user.roles.includes(EROLES.worker)) {
      req.query = { workerId: req.user.id.toString() };
      isWorker = true;
    }
    if (!isWorker) {
      const timesheet = await this.timesheet.findOne(ObjectId(id));
      if (!timesheet) {
        res.status(404);
        return;
      }

      res.send(timesheet);
      return;
    }
    req.query = {
      workerId: req.user.id.toString(),
      _id: ObjectId(id)
    };
    const timesheet = await this.timesheet.findOne(ObjectId(id));
    if (!timesheet) {
      res.status(404);
      return;
    }
    const result = await timesheet.workerView(req.user.id);
    if (!result) {
      res.status(404);
      return;
    }
    res.send(await timesheet.workerView(req.user.id));
  }

  @rescuable
  async create(req: Request, res: Response, next: NextFunction) {
    if (!req.user.roles.includes(EROLES.worker)) {
      res.status(400).send({ message: `Only workers can create timesheets` });
      return;
    }
    if (!req.body.hasOwnProperty("date")) {
      res.status(400).send({ message: '"date" is required' });
      return;
    }
    req.body.workerId = req.user.id.toString();
    const timesheet = await await this.timesheet.customCreate(req.body);
    if (!timesheet) {
      res.status(400).send({ message: `Unexpected Error` });
      return;
    }
    const jobRepository = getCustomRepository(JobRepositoryImpl);
    jobRepository.author = req.user;

    const job = await jobRepository.findById(timesheet.jobId.toString());
    if (!job) {
      res.status(404).send({ message: `Can't find Job` });
      await this.timesheet.destroy(timesheet.id.toString());
      return;
    }
    if (searchDepartmentById(job.department).otBreak) {
      timesheet.noBreak = false;
      await timesheet.save();
    }
    job.setWorkerStatus(req.user.id.toString(), req.body.date, WorkerJobStatus.REVIEW);
    const _job = await jobRepository.findById(timesheet.jobId.toString());
    await jobRepository.customUpdate(_job, { jobStatus: job.jobStatus, workers: job.workers });
    res.send(timesheet);
  }

  @rescuable
  async update(req: Request, res: Response, next: NextFunction) {
    const timesheet = await this.timesheet.findById(req.params.id.toString());
    if (!timesheet) {
      res.status(404).send();
      return;
    }

    if (timesheet.workerId && timesheet.jobId) {
      let job = await this.job.findById(timesheet.jobId.toString())

      job.workers.map((item: any) => {
        if (item.worker.id.toString() === timesheet.workerId.toString())
          item.status = 7;
        return item;
      })
      this.job.author = req.user;
      await this.job.findAndUpdate(job.id.toString(), { workers: job.workers })
    }

    res.send(await this.timesheet.customUpdate(timesheet, req.body, this.permitedAttributes));
  }

  
  @rescuable
  async updateSkipReason(req: Request, res: Response, next: NextFunction) {

    const timesheetId = req.params.id.toString();

    const timesheet = await this.timesheet.findById(timesheetId);
    if (!timesheet) {
      res.status(404).send();
      return;
    }

    if (timesheet.jobId) {
      let job = await this.job.findById(timesheet.jobId.toString())

      if (job.workers)
        job.workers.map((item: any) => {
          if (item.worker.id.toString() === timesheet.workerId.toString())
            item.status = 7;
          return item;
        })
      if (job.timesheets)
        job.timesheets.map((item: any) => {
          if (item.id.toString() === timesheetId)
            item.reason = req.query.reason;
          return item;
        })
      this.job.author = req.user;
      await this.job.findAndUpdate(job.id.toString(), { workers: job.workers, timesheets: job.timesheets })
    }

    res.send(await this.timesheet.customUpdate(timesheet, req.body, this.permitedAttributes));
  }
  
  
  @rescuable
  async _pdf(req: express.Request, res: express.Response, next: express.NextFunction) {
    const { params: { id } } = req;
    const timesheet = await this.timesheet.findOne(id.toString());
    if (!timesheet) {
      res.status(404).send();
      return;
    }
    const file = await timesheet.getPdfReport();
    res.download(file);
  }

  @rescuable
  async calcTotal(req: Request, res: Response, next: NextFunction) {
    const timesheet = await this.timesheet.findById(req.params.id.toString());
    if (!timesheet) {
      res.status(404).send();
      return;
    }
    timesheet.startDate = req.query.startDate;
    timesheet.finishDate = req.query.finishDate;
    res.send({ total: timesheet.totalH });
  }

  @rescuable
  async notifySupervisor(req: Request, res: Response, next: NextFunction) {
    const timesheet = await this.timesheet.findById(req.params.id.toString());
    if (!timesheet) {
      res.status(404).send();
      return;
    }

    if (timesheet.conEdisonSupervisor) {
      const user = await this.users.findById(timesheet.conEdisonSupervisor);
      const jobRepository = getCustomRepository(JobRepositoryImpl);

      const job = await jobRepository.findById(timesheet.jobId.toString());
      const url = `${process.env.CLIENT_DOMAIN}/timesheets/${timesheet.id}/edit`;
      this.mailer.send(user.email, { url, confirmationNumber: job.confirmationNumber }, "notifySupervisor")
    }

    res.send();
  }

  get permitedAttributes() {
    return [
      "electric",
      "gas",
      "locations",
      "startDate",
      "finishDate",
      "totalHours",
      "hasLunch",
      "hasDinner",
      "noBreak",
      "conEdisonTruck",
      "conEdisonSupervisor",
      "sign"
    ];
  }


}

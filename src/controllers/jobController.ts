import { TYPES } from "@commons";
import { rescuable } from "@commons/decorators";
import { SystemLogger } from "@loggers";

import {
  JobRepositoryImpl,
  NotificationRepositoryImpl,
  UserRepositoryImpl,
} from "@repositories";
import express, { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { getCustomRepository, ObjectID } from "typeorm";

import multer = require("multer");
import ApplicationController from "./applicationController";
import passport from "passport";
import { Job, JobWorker, Notification } from "@entities";
import { JobStatus } from "@constants";
import { EROLES } from "@constants";
import { WorkerJobStatus } from "../entities/jobWorker";
import * as fs from "fs";
import * as path from "path";
import { Mailer } from "../mails";
import { notifiableTypes } from "../entities/notification";
import { notifyServer } from "../app";
import { isArray } from "lodash";

const { ObjectId } = require("mongodb").ObjectId;

@injectable()
export class JobController extends ApplicationController {
  logger: SystemLogger;
  job: JobRepositoryImpl;
  notification: NotificationRepositoryImpl;
  users: UserRepositoryImpl;
  mailer: Mailer;
  location: any;

  constructor(
    @inject(TYPES.SystemLogger) _logger: SystemLogger,
    @inject(TYPES.Mailer) _mailer: Mailer
  ) {
    super(_logger);
    this.job = getCustomRepository(JobRepositoryImpl);
    this.notification = getCustomRepository(NotificationRepositoryImpl);
    this.users = getCustomRepository(UserRepositoryImpl);
    this.mailer = _mailer;
  }

  register(app: express.Application, upload: multer.Instance): void {
    super.register(app);
    const router = express.Router();

    router.all("*", passport.authenticate("jwt", { session: false }));

    app.use("/jobs", router);

    router.route("/").post(this._addMany);
    router.route("/confirm-number-jobs").get(this.updateConfirmNumberJobs);
    router.route("/duplicate").post(this._jobDuplicate);
    router.route("/:creatorId").post(this._add);
    router.route("/").get(this._findAll);
    router.route("/projects").get(this.jobsProjects);
    router.route("/search").get(this._find);
    router.route("/:id/workers").post(this._addWorker);
    router.route("/:id/workers").delete(this._removeWorker);
    router.route("/:id/workers").put(this._updateWorker);
    router.route("/pos").put(this._updatePO);
    router.route("/:id").put(this._update);
    router.route("/:id").delete(this._delete);
    router.route("/:id").get(this._show);

    router
      .route("/:id/images")
      .put(upload.array("images"), this.uploadWorkerImages);
    router.route("/:id/images").delete(this.removeWorkerImages);
    router.route("/:id/has-seen").put(this.hasSeen);
    router
      .route("/:id/upload/job-image")
      .put(upload.array("images"), this.updateJobImage);
    router
      .route("/upload/job-image")
      .put(upload.array("images"), this.addJobImage);
    router.route("/re-route/jobs").put(this.reRouteWorkers);
    router.route("/test/socket").get(this.testSocket);
  }

  testSocket = async (req: Request, res: Response, next: NextFunction) => {
    const job = await this.job.findById("5da49ae110edbf7c782f4c60");
    NotificationRepositoryImpl.createNotificationForJob(
      job,
      notifiableTypes.CREATE_JOB
    );
    res.json({ message: "success" });
  };

  reRouteWorkers = async (req: Request, res: Response, next: NextFunction) => {
    const { workers, location } = req.body;
    if (!workers || !Array.isArray(workers)) {
      return res.status(400).send({ message: '"worker" is required' });
    }
    if (!location) {
      return res.status(400).send({ message: '"location" is required' });
    }
    if (Array.isArray(location)) {
      return res.status(400).send({ message: '"location" is invalid' });
    }

    const jobIds: any[] = [];
    const jobMap: { [jobId: string]: string[] } = {};
    for (const worker of workers) {
      if (!worker.jobId)
        return res.status(400).send({ message: '"jobId" is required' });
      if (!worker.workerIds || !Array.isArray(worker.workerIds))
        return res.status(400).send({ message: '"workerIds" is required' });
      jobIds.push(ObjectId(worker.jobId));
      jobMap[worker.jobId] = worker.workerIds;
    }

    const jobs = await this.job.findAllNoPaginate({ _id: { $in: jobIds } });
    if (!jobs || !jobs.length) {
      return res.status(404).send({ message: "jobs not found" });
    }

    const fns: any[] = [];
    for (const job of jobs) {

     // let updateUser:JobWorker[]=[];

      job.workers = job.workers.map((item) => {
        if (
          jobMap[job.id.toString()] &&
          jobMap[job.id.toString()].indexOf(item.workerId) >= 0
        ) {
          const updated = {
            worker: '',
            old: {},
            new: {}
          } as any;
          const checkLocation = job.locations.filter(
            (loca) => loca.address === location.address
          );
          const locationIndex = job.locations.indexOf(checkLocation[0]);
          console.log("item: ", item);
          updated.old.address = item.location.address;
          item.location = location;
          updated.new.address = location.address;
          item.locationID =
            locationIndex > -1 ? locationIndex : job.locations.length + 1;
          item.status = 0;

          if (locationIndex < 0) {
            job.locations = [...job.locations, location];
          }
          updated.worker = item.worker.name;

          NotificationRepositoryImpl.createNotificationForJob(
            job,
            notifiableTypes.JOB_REROUTE_CURRENT,
            updated
          );
          /**
           * apollo
           */
          item.hasSeen = false
          //updateUser.push(item)
          /**
           * --apollo
           */
        }
        return item;
      });

      this.job.author = req.user;
      const job_updated = await this.job.customUpdate(
        job,
        job,
        this.permitedAttributes
      );
      //(await notifyServer).sendUpdateJobWithUser(job_updated,updateUser)//apollo
      await fns.push(job.save());
    }
    const updated = await Promise.all(fns);
    res.json(updated);
  };

  addJobImage = async (req: Request, res: Response, next: NextFunction) => {
    const images = this.getUploadFilesPaths(req, { contentType: "image/jpeg" });
    if (!images.length) {
      res.status(400).send({ message: '"images" are required' });
      return;
    }
    res.json(images);
  };

  updateJobImage = async (req: Request, res: Response, next: NextFunction) => {
    const job = await this.job.findById(req.params.id);
    if (!job) {
      res.status(404).send();
      return;
    }

    const images = this.getUploadFilesPaths(req, { contentType: "image/jpeg" });
    if (!images.length) {
      res.status(400).send({ message: '"images" are required' });
      return;
    }

    this.job.author = req.user;
    await this.job.customUpdate(
      job,
      { jobImages: images },
      this.permitedAttributes
    );
    res.json(job);
  };

  @rescuable
  async _add(req: Request, res: Response, next: NextFunction) {
    this.job.author = req.user;
    const job = await this.job.add(
      { ...req.body, creatorId: String(req.user.id), jobStatus: JobStatus.New },
      this.permitedAttributes
    );
    res.send(job);
  }

  @rescuable
  async _addWorker(req: Request, res: Response, next: NextFunction) {
    const { worker } = req.body;
    if (!worker) {
      res.status(400).send({ message: '"worker" is required' });
      return;
    }
    const job = await this.job.findById(req.params.id);

    if (!job) {
      res.status(404).send();
      return;
    }

    const exist = job.workers.find(
      (_worker) =>
        _worker.workerId === worker.workerId &&
        _worker.startDate === worker.startDate
    );
    if (exist) {
      res
        .status(400)
        .send({ message: `worker with id=${worker.workerId} already exist` });
      return;
    }
    this.job.author = req.user;
    res.send(
      await this.job.customUpdate(
        job,
        { workers: [...job.workers, { ...worker, assignorId: req.user.id }] },
        this.permitedAttributes
      )
    );
  }

  @rescuable
  async _updateWorker(req: Request, res: Response, next: NextFunction) {
    if (!req.body.hasOwnProperty("status")) {
      res.status(400).send({ message: '"status" is required' });
      return;
    }
    if (!req.body.hasOwnProperty("date")) {
      res.status(400).send({ message: '"date" is required' });
      return;
    }
    const job = await this.job.findById(req.params.id);

    if (!job) {
      res.status(404).send();
      return;
    }
    let isWorker = false;
    let workerId: string = undefined;
    if (req.user.roles && req.user.roles.includes(EROLES.worker)) {
      workerId = req.user.id.toString();
      isWorker = true;
    } else if (req.body.hasOwnProperty("workerId")) {
      workerId = req.body.workerId;
    }
    const index = job.workers.findIndex(
      (_worker) =>
        _worker.workerId === workerId && req.body.date === _worker.startDate
    );
    if (index === -1) {
      res
        .status(400)
        .send({ message: `worker with id=${workerId} does not exist` });
      return;
    }
    if (!WorkerJobStatus.hasOwnProperty(+req.body.status)) {
      res
        .status(400)
        .send({ message: `Status ${req.body.status} does not exist` });
      return;
    }
    const old = { ...job } as Job;
    job.setWorkerStatus(workerId, req.body.date, +req.body.status);
    old.notificationObj = job.notificationObj;
    this.job.author = req.user;
    await this.job.customUpdate(
      old,
      { jobStatus: job.jobStatus, workers: job.workers, hasSeen: false },
      this.permitedAttributes
    );
    const worker = job.workers[index];
    if (WorkerJobStatus.CANNOTSECURE === +req.body.status) {
      const supervisor = await this.users.findById(job.supervisor);
    }


    if (isWorker) {
      res.send(job.workerView(worker));
    } else {
      res.send(job);
    }
  }

  @rescuable
  async _jobDuplicate(req: Request, res: Response, next: NextFunction) {

    const { location, department } = req.body;

    if (!isArray(location) || !department) {
      res.status(400).send({ message: 'lack of input data (  location && department )' });
      return;
    }

    let job = await this.job.findAllNoPaginate({ department: department })

    job.filter((item => {
      if (item.locations) {
        for (let i = 0; i < item.locations.length; i++) {
          const element = item.locations[i];
          location.forEach(element => {
            if (item.locations[i].address === element.address){
              console.log('id : ',item.id);
              return true
            }
            return false
          });
          return false
        }
      }
    }))

    return res.send(job);
  }

  removeWorkerImages = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!req.body.date) {
      res.status(400).send({ message: '"date" is required' });
      return;
    }
    const job = await this.job.findById(req.params.id);

    if (!job) {
      res.status(404).send();
      return;
    }
    let isWorker = false;
    let workerId: string = undefined;
    if (req.user.roles && req.user.roles.includes(EROLES.worker)) {
      workerId = req.user.id.toString();
      isWorker = true;
    } else if (req.body && req.body.hasOwnProperty("workerId")) {
      workerId = req.body.workerId;
    }
    const index = job.workers.findIndex(
      (_worker) =>
        _worker.workerId === workerId && req.body.date === _worker.startDate
    );
    if (index === -1) {
      res
        .status(400)
        .send({ message: `worker with id=${workerId} does not exist` });
      return;
    }

    const jWorkers = [...job.workers];
    if (req.body.image) {
      const iIndex = jWorkers[index].images.indexOf(req.body.image);
      if (iIndex > -1) {
        jWorkers[index].images.splice(iIndex, 1);
        try {
          fs.unlinkSync(path.join(process.cwd(), req.body.image));
        } catch (e) {
          console.error(e);
        }
      }
    }

    this.job.author = req.user;
    await this.job.customUpdate(
      job,
      { workers: jWorkers },
      this.permitedAttributes
    );
    if (isWorker) {
      res.send(job.workerView(job.workers[index]));
    } else {
      res.send(job);
    }
  };

  uploadWorkerImages = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const images = this.getUploadFilesPaths(req, { contentType: "image/jpeg" });
    if (!images.length) {
      res.status(400).send({ message: '"images" are required' });
      return;
    }
    if (!req.body.date) {
      res.status(400).send({ message: '"date" is required' });
      return;
    }
    const job = await this.job.findById(req.params.id);

    if (!job) {
      res.status(404).send();
      return;
    }
    let isWorker = false;
    let workerId: string = undefined;
    if (req.user.roles && req.user.roles.includes(EROLES.worker)) {
      workerId = req.user.id.toString();
      isWorker = true;
    } else if (req.body && req.body.workerId) {
      workerId = req.body.workerId;
    }
    const index = job.workers.findIndex(
      (_worker) =>
        _worker.workerId === workerId && req.body.date === _worker.startDate
    );
    if (index === -1) {
      res
        .status(400)
        .send({ message: `worker with id=${workerId} does not exist` });
      return;
    }

    const jWorkers = [...job.workers];
    jWorkers[index].images = [...jWorkers[index].images, ...images];
    job.notificationObj = { type: notifiableTypes.WORKER_UPLOAD_AN_IMAGE };

    this.job.author = req.user;
    await this.job.customUpdate(
      job,
      { workers: jWorkers },
      this.permitedAttributes
    );
    if (isWorker) {
      res.send(job.workerView(job.workers[index]));
    } else {
      res.send(job);
    }
  };

  @rescuable
  async _removeWorker(req: Request, res: Response, next: NextFunction) {
    const { worker } = req.body;
    if (!worker) {
      res.status(400).send({ message: '"worker" is required' });
      return;
    }
    const job = await this.job.findById(req.params.id);

    if (!job) {
      res.status(404).send();
      return;
    }
    this.job.author = req.user;
    res.send(
      await this.job.customUpdate(
        job,
        {
          workers: job.workers.filter(
            (_worker) => _worker.workerId !== worker.workerId
          ),
        },
        this.permitedAttributes
      )
    );
  }

  @rescuable
  async updateConfirmNumberJobs(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const jobs = await this.job.findAllNoPaginate({});

    this.job.author = req.user;
    const data: any[] = [];
    for (const job of jobs) {
      job.confirmNumber = String(job.tableId + 100000001);
      data.push({ ...job });
    }

    const _jobs = await Promise.all(
      data.map(async (job: any) => {
        // update confirm number
        const attrs = {
          confirmNumber: String(job.tableId + 100000001),
        };

        const jobData = job;
        delete jobData.changesLog;
        delete jobData.statusLog;

        const update_job = await this.job.customUpdate(
          jobData,
          attrs,
          this.permitedAttributes
        );
        return update_job;
      })
    );

    res.send({
      status: "success",
      message: "updated all jobs",
      data: _jobs,
    });
  }

  @rescuable
  async _addMany(req: Request, res: Response, next: NextFunction) {
    const { jobs, totalPo, title, old } = req.body;
    if (!jobs || !Array.isArray(jobs)) {
      res.status(400).send({ message: '"jobs" is required' });
      return;
    }
    this.job.author = req.user;
    const data: any[] = [];
    for (const job of jobs) {
      job.confirmNumber = "0";
      job.workers = job.workers.map((worker: JobWorker) => {
        if (job.locations && Array.isArray(job.locations)) {
          const checkLocation = job.locations.filter(
            (el: any) => el.address === worker.location.address
          );
          const locationIndex = job.locations.indexOf(checkLocation[0]);
          worker.location = checkLocation[0];
          worker.locationID = locationIndex;
          worker.status = WorkerJobStatus.NEW;
        }
        worker.assignerId = req.user.id.toString();
        return worker;
      });
      data.push({
        ...job,
        creatorId: String(req.user.id),
        jobStatus: JobStatus.New,
      });
    }

    const _jobs = await Promise.all(
      data.map(async (job: any) => {
        const new_job = await this.job.add(job, this.permitedAttributes);

        // update confirm number
        const attrs = {
          confirmNumber: String(new_job.tableId + 100000001),
        };

        const jobData = new_job;
        delete jobData.changesLog;
        delete jobData.statusLog;

        const update_job = await this.job.customUpdate(
          jobData,
          attrs,
          this.permitedAttributes
        );

        if (old && Array.isArray(old)) {
          old.forEach((item) => {
            NotificationRepositoryImpl.createNotificationForJob(
              update_job,
              notifiableTypes.JOB_REROUTE_NEW_JOB,
              item
            );
          });

        }
        return new_job;
      })
    );

    res.send(_jobs);
  }

  @rescuable
  async _findAll(req: Request, res: Response, next: NextFunction) {
    const query = await Job.buildSearchQuery(
      req.query,
      req.body.authType !== "admin"
    );

    const bearerToken: string = req.headers.authorization;

    let { page, workerStatus } = req.query;
    if (workerStatus) {
      if (!Number(workerStatus)) {
        switch (workerStatus) {
          case 'review':
            workerStatus = [5];
            break;
          case 'completed':
            workerStatus = [7];
            break;
          case 'new':
            workerStatus = [null, undefined, 0, 1, 2, 3, 4, 6];
            break;
          case 'inProgress':
            workerStatus = [null, undefined, 0, 1, 2, 3, 4, 6];
            break;
          default:
            workerStatus = [];
            break;

        }
      }
      req.query.workerStatus = workerStatus.map((item: any) => Number(item))
    }

    const { user } = req;
    let isWorker = false;
    if (user && user.roles && user.roles.includes(EROLES.worker)) {
      isWorker = true;
      query.workers = { $elemMatch: { workerId: req.user.id.toString() } };
    } else if (req.query.worker) {
      query.workers = {
        $elemMatch: { workerId: req.query.worker.id.toString() },
      };
    }

    if (user && user.roles) {
      if (
        (req.query.hasOwnProperty("field_supervisor") &&
          req.query.field_supervisor === "true" &&
          user.roles.includes(EROLES.coned_field_supervisor)) ||
        ((user.roles.includes(EROLES.requestor) ||
          user.roles.includes(EROLES.department_supervisor) ||
          user.roles.includes(EROLES.coned_billing_admin)) &&
          !(
            user.roles.includes(EROLES.dispatcher) ||
            user.roles.includes(EROLES.dispatcher_supervisor) ||
            user.roles.includes(EROLES.billing) ||
            user.roles.includes(EROLES.superadmin)
          ))
      ) {
        const departments: any[] = user.departments;
        const departmentIds: any[] = departments.map((el) => Number(el.id));
        query["department"] = { $in: departmentIds };
      }
    }

    if (user && user.roles) {
      if (user.roles.includes(EROLES.requestor)) {
        if (
          !(
            user.roles.includes(EROLES.department_supervisor) ||
            user.roles.includes(EROLES.dispatcher) ||
            user.roles.includes(EROLES.dispatcher_supervisor) ||
            user.roles.includes(EROLES.billing) ||
            user.roles.includes(EROLES.superadmin)
          )
        ) {
          query["creatorId"] = `${user.id}`;
        }
      }
    }

    if (user && user.roles) {
      if (user.roles.includes(EROLES.coned_field_supervisor)) {
        if (
          !(
            user.roles.includes(EROLES.requestor) ||
            user.roles.includes(EROLES.department_supervisor) ||
            user.roles.includes(EROLES.dispatcher) ||
            user.roles.includes(EROLES.dispatcher_supervisor) ||
            user.roles.includes(EROLES.billing) ||
            user.roles.includes(EROLES.superadmin)
          )
        ) {
          query["supervisor"] = `${user.id}`;
        }
      }
    }

    if (page) {
      req.query = { page: req.query.page };
      const found = await this.job.findAllWithTextSearch(req, query);
      if (workerStatus) req.query.workerStatus = workerStatus;
      const _jobs = this.filterJobsWithWorker(found.results, isWorker, req);
      res.send({
        results: _jobs,
        total: found.total,
        page: found.page,
        totalPage: found.totalPage,
        limit: found.limit,
      });
    } else {
      const found = await this.job.findAllNoPaginate(query);
      const _jobs = this.filterJobsWithWorker(found, isWorker, req);
      res.send({
        results: _jobs,
        totalPage: found.length,
      });
    }
  }
  filterJobsWithWorker(jobs: Job[], isWorker: boolean, req: Request) {
    let _jobs: any[];
    _jobs = jobs;
    if (isWorker) {
      _jobs = [];
      jobs.forEach((job) => {
        let workerAsigns: any[];
        let timesheetId: any[];
        let conEdisonTruck:Number;//apollo

        if(job.jobStatus!==6){
          workerAsigns = job.workers.filter(
            (jW) => {
              if (req.query.workerStatus && !req.query.workerStatus.includes(jW.status))
                return false;
              return jW.workerId === req.user.id.toString()
            }
          );
          timesheetId = job.timesheets && job.timesheets.map((item: any) => {
                            conEdisonTruck = item.conEdisonTruck;
                            return item.id;
                        }
                    );
          workerAsigns.forEach((jW) => {
            _jobs.push({...job.workerView(jW),"timeSheetsId":timesheetId,'conEdisonTruck':conEdisonTruck});
          });
        }
      });
    }
    _jobs.map((_job) => {
      if (_job.changesLog) {
        delete _job.changesLog;
        delete _job.timesheets;
        return _job;
      }
    });
    return _jobs;
  }

  @rescuable
  async jobsProjects(req: Request, res: Response, next: NextFunction) {
    const query = await Job.buildSearchQuery(req.query);
    if (req.query.page) {
      req.query = { page: req.query.page };
    } else {
      req.query = { page: 1 };
    }

    const found = await this.job.aggregate(
      {
        $group: { _id: "$totalPo", jobs: { $push: "$$ROOT._id" } },
      },
      req.query.page,
      query
    );
    let projects: any;
    projects = await Promise.all(
      found.results.map(async (project: any) => {
        const jobsIds: Array<string> = [];
        project.jobs.forEach((jobId: any) => jobsIds.push(ObjectId(jobId)));
        const jobs = await this.job.findByIds(jobsIds);
        jobs.map((_job) => {
          if (!_job.changesLog) {
            return _job;
          }
          delete _job.changesLog;
          delete _job.timesheets;
          return _job;
        });
        return { _id: project._id, jobs };
      }) as any
    );

    res.send({
      results: projects,
      total: found.total,
      page: found.page,
      totalPage: found.totalPage,
      limit: found.limit,
    });
  }

  @rescuable
  async _find(req: Request, res: Response, next: NextFunction) {
    res.send(await this.job.findAll(req));
  }

  @rescuable
  async _show(req: Request, res: Response, next: NextFunction) {
    const job = await this.job.findById(req.params.id.toString());
    if (!job) {
      res.status(404).send();
      return;
    }
    const timesheets = [] as any;
    let totals = {} as any;
    if (job.timesheets && job.timesheets.length) {
      for (let i = 0; i < job.timesheets.length; i++) {
        timesheets.push(await job.timesheets[i].invoiceView(undefined, true));
      }
      totals = timesheets.reduce(
        (a: any, b: any) => {
          return {
            regularHours: a.regularHours + b.regularHours,
            overtimeHours: a.overtimeHours + b.overtimeHours,
            holidayHours: a.holidayHours + b.holidayHours,
            totalHours: a.totalHours + b.totalHours,
          };
        },
        { regularHours: 0, overtimeHours: 0, holidayHours: 0, totalHours: 0 }
      );
    }
    if (job.workers.length) {
      const workers: any[] = [];
      for (let i = 0; i < job.workers.length; i++) {
        if (
          !req.query.workerId ||
          (req.query.workerId && req.query.workerId == job.workers[i].workerId)
        ) {
          if (job.workers[i].assignerId) {
            const assigner = await this.users.findById(
              job.workers[i].assignerId
            );
            job.workers[
              i
            ].assignerName = `${assigner.firstName} ${assigner.lastName}`;
          }
//          job.workers[i].hasSeen = false  //apollo
          workers.push(job.workers[i]);
        }
      }
      job.workers = workers;
    }
    res.send({ ...job, confirmationNumber: job.confirmationNumber, ...totals });
  }

  @rescuable
  async _update(req: Request, res: Response, next: NextFunction) {
    const attrs = { ...req.body };
    const job = await this.job.findById(req.params.id);

    console.log("permitedAttributes: ", this.permitedAttributes);
    console.log("attrs: ", attrs);

    if (Array.isArray(attrs.workers)) {
      attrs.workers = attrs.workers.map((worker: any) => {
        const checkLocation = job.locations.filter(
          (loca) =>
            loca && worker.location && loca.address === worker.location.address
        );
        const locationIndex = job.locations.indexOf(checkLocation[0]);
        return {
          ...worker,
          location: checkLocation[0],
          locationID: locationIndex,
          status: worker.status ? worker.status : JobStatus.New,
         // hasSeen:false   //apollo
        };
      });
    }
    if (!job) {
      res.status(404).send();
      return;
    }
    this.job.author = req.user;
    res.send(await this.job.update(job, attrs, this.permitedAttributes));
  }

  @rescuable
  async _delete(req: Request, res: Response, next: NextFunction) {
    if ((req.params.id, req.user)) {
      await this.job.delete(req.params.id);
      res.sendStatus(202);
    }
    res.end();
  }

  @rescuable
  async _updatePO(req: Request, res: Response, next: NextFunction) {
    if (!req.body.ids || !req.body.newPo) {
      res.status(400).send({ message: '"Ids and new Po" are required' });
      return;
    }
    if (!Array.isArray(req.body.ids)) {
      res.status(400).send({ message: '"Ids" must be an array!' });
      return;
    }
    if (isNaN(req.body.newPo)) {
      res.status(400).send({ message: '"new Po" must be a number!' });
      return;
    }
    this.job.author = req.user;
    for (let i = 0; i < req.body.ids.length; i++) {
      const job = await this.job.findById(req.body.ids[i].toString());
      if (!job) {
        continue;
      }
      job.notificationObj = { type: notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED };
      await this.job.customUpdate(job, { po: req.body.newPo });
    }
    res.sendStatus(202);
  }

  hasSeen = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!req.body.hasOwnProperty("hasSeen")) {
      res.status(400).send({ message: '"hasSeen" is required' });
      return;
    }

    const job = await this.job.findById(req.params.id);
    if (!job) {
      res.status(404).send();
      return;
    }

    let workerId: string = undefined;
    if (req.user.roles && req.user.roles.includes(EROLES.worker)) {
      workerId = req.user.id.toString();
    } else if (req.body.hasOwnProperty("workerId")) {
      workerId = req.body.workerId;
    }
    const index = job.workers.findIndex(
      (_worker) => _worker.workerId === workerId
    );
    if (index === -1) {
      res
        .status(400)
        .send({ message: `worker with id=${workerId} does not exist` });
      return;
    }
    job.workers[index].hasSeen = req.body.hasSeen
    job.hasSeen = req.body.hasSeen;

    await job.save();
    res.send(job);
  };

  get permitedAttributes() {
    return [
      "title",
      "totalPo",
      "jobType",
      "requestTime",
      "requestor",
      "supervisor",
      "department",
      "section",
      "po",
      "maxWorkers",
      "feeder",
      "wr",
      "requisition",
      "structure",
      "locations",
      "comment",
      "workers",
      "jobStatus",
      "status",
      "creatorId",
      "account",
      "municipality",
      "endTime",
      "hasSeen",
      "jobImages",
      "confirmNumber",
    ];
  }
}

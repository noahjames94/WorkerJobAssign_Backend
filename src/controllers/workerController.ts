import * as express from "express";
import { injectable, inject, id } from "inversify";

import ApplicationController from "./applicationController";
import { SystemLogger } from "@loggers";
import { TYPES } from "@commons";
import { Pagination } from "@paginate";
import {
  JobRepositoryImpl,
  UserRepositoryImpl,
  SubcontractorRepositoryImpl,
} from "@repositories";
import { rescuable } from "@commons/decorators";
import { getCustomRepository, Any, getMongoRepository } from "typeorm";
import { EROLES, APPROVE, ACTIVE } from "@constants";
import { Subcontractor, User, WorkerTrace } from "../entities";
import passport from "passport";
import multer = require("multer");
import { DateTime } from "../utils/dateTime/dateTime";
import { isAllowed } from "../policies";
import { WorkerTraceRepositoryImpl } from "../repositories/workerTrace";
import { ErrorMessage } from "../models";
const { ObjectId } = require("mongodb");
const generator = require("generate-password");
import * as bcrypt from "bcryptjs";
import { ITEMS_PER_PAGE } from "../utils/queryBuilder/const";
import moment = require("moment");
import Excel from "exceljs";
import { JobType } from "@constants";

@injectable()
export class WorkerController extends ApplicationController {
  logger: SystemLogger;
  users: UserRepositoryImpl;
  jobs: JobRepositoryImpl;
  trace: WorkerTraceRepositoryImpl;
  subcontractor: SubcontractorRepositoryImpl;

  constructor(@inject(TYPES.SystemLogger) _logger: SystemLogger) {
    super(_logger);
    this.users = getCustomRepository(UserRepositoryImpl);
    this.jobs = getCustomRepository(JobRepositoryImpl);
    this.trace = getCustomRepository(WorkerTraceRepositoryImpl);
    this.subcontractor = getCustomRepository(SubcontractorRepositoryImpl);
  }

  register(app: express.Application, upload: multer.Instance): void {
    super.register(app);

    const router = express.Router();
    app.use("/workers", router);

    router.route("/").get(this._index);
    router
      .route("/calendar-jobs")
      .get(
        passport.authenticate("jwt", { session: false }),
        this._calendarJobs
      );
    router
      .route("/trace")
      .post(passport.authenticate("jwt", { session: false }), this._addTrace);
    router
      .route("/trace")
      .get(passport.authenticate("jwt", { session: false }), this._getTrace);

    router.route("/:id").get(this._show);
    router.route("/create").post(upload.single("avatar"), this._create);
    router.route("/:id").put(upload.single("avatar"), this._update);
    router
      .route("/:id")
      .delete(
        [passport.authenticate("jwt", { session: false }), isAllowed],
        this._delete
      );
    router
      .route("/import-excel")
      .post(
        passport.authenticate("jwt", { session: false }),
        upload.single("excel"),
        this._importWorkers
      );
  }

  @rescuable
  async _create(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const attributes = {
      ...req.body,
      avatar: this.getUploadFilesPath(req),
    } as any;
    if (!attributes.password) {
      const password = generator.generate({
        length: 10,
        numbers: true,
        excludeSimilarCharacters: true,
      });
      attributes.password = password;
      attributes.repeatPassword = password;
    } else {
      attributes.repeatPassword = attributes.password;
    }

    if (attributes.workerTypes && Array.isArray(attributes.workerTypes)) {
      attributes.workerTypes = attributes.workerTypes.map((item: string) =>
        Number(item)
      );
    }

    let subcontractor = null;

    if (attributes.subcontractorId) {
      subcontractor = ObjectId.isValid(attributes.subcontractorId)
        ? await Subcontractor.findOne(attributes.subcontractorId)
        : undefined;
      if (subcontractor) {
        attributes.subcontractor_name = subcontractor.name;
        attributes.subcontractor = subcontractor;
      }
    }

    attributes.roles = [EROLES.worker];
    this.generateUploadFileAttrs(req);
    const worker = await this.users.customCreate(
      attributes,
      this.permitedAttributes
    );

    if (subcontractor) {
      subcontractor.workerIds.push(worker.id.toString());
      await subcontractor.save();
    } else {
      await this.users.destroy(worker.id.toString());
      res.status(400).json({ message: "Subcontractor not found" });
    }
    this.users.changeEmail(worker, worker.email, attributes.password);
    res.status(201).end();
  }

  @rescuable
  async _update(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const {
      params: { id },
    } = req;
    let { body: attributes } = req;

    const user = await this.users.findById(id);

    const file = this.getUploadFilesPath(req);
    if (file && file.length) {
      attributes.avatar = file;
    }
    if (
      attributes.password ||
      (attributes.password && attributes.repeatPassword)
    ) {
      if (attributes.password !== attributes.repeatPassword) {
        const errorMessage = new ErrorMessage(
          "invalid token",
          "Passwords does not match",
          []
        );
        res.status(400).json(errorMessage);
      }
      attributes.password = bcrypt.hashSync(attributes.password, 10);
      attributes.repeatPassword = attributes.password;
    }
    if (attributes.status) {
      let statusQ = {};
      switch (attributes.status.toLowerCase()) {
        case "inactive":
          statusQ = { isActive: ACTIVE.inactive, isApproved: APPROVE.rejected };
          break;
        case "onhold":
          statusQ = { isApproved: APPROVE.waiting, isActive: ACTIVE.onhold };
          break;
        case "active":
          statusQ = { isActive: ACTIVE.active };
          break;
      }
      if (statusQ !== {}) {
        attributes = { ...attributes, ...statusQ };
        delete attributes.status;
      }
    }

    if (attributes.roles && attributes.roles.length) {
      attributes.roles = attributes.roles.map((id: any) => parseInt(id, 10));
    }

    if (attributes.workerTypes && Array.isArray(attributes.workerTypes)) {
      attributes.workerTypes = attributes.workerTypes.map((item: string) =>
        Number(item)
      );
    }

    let subcontractor = null;

    if (attributes.subcontractorId) {
      subcontractor = ObjectId.isValid(attributes.subcontractorId)
        ? await Subcontractor.findOne(attributes.subcontractorId)
        : undefined;
      if (subcontractor) {
        attributes.subcontractor_name = subcontractor.name;
        attributes.subcontractor = subcontractor;
        user.subcontractor_name = subcontractor.name;
        user.subcontractor = subcontractor;
      }
    }

    const response = await this.users.customUpdate(
      user,
      attributes,
      this.permitedAttributes
    );

    // await this.users.findAndUpdate(
    //   id.toString(),
    //   attributes,
    //   this.permitedAttributes
    // );

    res.status(202).end();
  }

  @rescuable
  async _index(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    let query = { roles: EROLES.worker } as any;
    const status = req.query.status;
    if (status) {
      let statusQ = {};
      switch (status.toLowerCase()) {
        case "inactive":
          statusQ = { isActive: ACTIVE.inactive, isApproved: APPROVE.rejected };
          break;
        case "onhold":
          statusQ = { isApproved: APPROVE.waiting, isActive: ACTIVE.onhold };
          break;
        case "active":
          statusQ = { isActive: ACTIVE.active, isApproved: APPROVE.approved };
          break;
        case "available":
          const time = moment(new Date()).format("HHmm");
          statusQ = {
            isActive: ACTIVE.active,
            isApproved: APPROVE.approved,
            time: {
              $elemMatch: { begin: { $gte: time }, end: { $gte: time } },
            },
          };
          break;
      }
      if (statusQ !== {}) {
        query = { ...query, ...statusQ };
      }
    }
    if (req.query.firstName) {
      query.firstName = {
        $regex: new RegExp(req.query.firstName),
        $options: "si",
      };
    }
    if (req.query.subcontractorName) {
      query.subcontractor_name = {
        $regex: new RegExp(req.query.subcontractorName),
        $options: "si",
      };
    }
    if (req.query.email) {
      query.email = { $regex: new RegExp(req.query.email), $options: "si" };
    }
    if (req.query.phoneNumber) {
      query.phoneNumber = {
        $regex: new RegExp(req.query.phoneNumber),
        $options: "si",
      };
    }
    if (req.query.workerIds && Array.isArray(req.query.workerIds)) {
      query._id = {
        $in: req.query.workerIds.map((id: string) => ObjectId(id)),
      };
    }
    if (req.query.workerTypes && Array.isArray(req.query.workerTypes)) {
      query.workerTypes = {
        $in: req.query.workerTypes.map((type: string) => Number(type)),
      };
    }

    if (req.query.page) {
      req.query = { page: req.query.page };
    } else {
      req.query = {};
    }

    const aggQuery: any[] = [
      {
        $addFields: {
          time: {
            $reduce: {
              input: "$workingHours",
              initialValue: [],
              in: {
                $concatArrays: [
                  [
                    {
                      begin: {
                        $concat: ["$$this.begin.hour", "$$this.begin.minute"],
                      },
                      end: {
                        $concat: ["$$this.end.hour", "$$this.end.minute"],
                      },
                    },
                  ],
                  "$$value",
                ],
              },
            },
          },
        },
      },
      {
        $match: query,
      },
      { $project: { _id: 1 } },
    ];

    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || ITEMS_PER_PAGE;

    const skip = (page - 1) * limit < 0 ? 0 : (page - 1) * limit;
    const pageQuery = aggQuery.concat([{ $skip: skip }, { $limit: limit }]);

    const userIds = (
      await getMongoRepository(User).aggregate(pageQuery).toArray()
    ).map((item) => item._id);
    const results = await getMongoRepository(User)
      .aggregate(aggQuery)
      .toArray();

    const listUsers = await this.users.findByIds(userIds);

    const data = [];
    for (let i = 0; i < listUsers.length; i++) {
      const user = listUsers[i];
      if (user.subcontractorId) {
        const subcontractor = await this.subcontractor.findById(
          user.subcontractorId
        );
        user.subcontractor = subcontractor;
      }
      data.push(user);
    }

    const response = new Pagination<User>({
      results: data,
      total: results.length,
      page,
      limit,
    });

    res.send(response);
  }

  @rescuable
  async _show(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const {
      params: { id },
    } = req;
    const worker = await this.users.findOne(id, { roles: 9 });
    if (!worker) {
      res.status(404).send();
      return;
    }
    res.send(worker);
  }

  @rescuable
  async _calendarJobs(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (!req.user.roles.includes(EROLES.worker)) {
      res
        .status(400)
        .send({ message: `worker with id=${req.user.id} not exists` });
      return;
    }
    const query = <any>{};
    query["workers.workerId"] = req.user.id.toString();
    const date = new Date(),
      y = date.getFullYear(),
      m = date.getMonth();
    const filter = <any>{};
    filter.$gte = req.body.from
      ? req.body.from
      : `${new Date(y, m, 1).toISOString()}`;
    filter.$lt = req.body.to
      ? req.body.to
      : `${new Date(y, m + 1, 0).toISOString()}`;
    query["workers.startDate"] = filter;
    const jobList = new Map();
    const found = await this.jobs.findAllNoPaginate(query);
    found.forEach((_job) => {
      const index = _job.workers.findIndex(
        (_worker) => _worker.workerId === req.user.id.toString()
      );
      if (index !== -1) {
        const job = _job.workerView(_job.workers[index]);
        _job.workers.forEach((worker) => {
          const wTime = new Date(worker.startDate);
          const dateTime = new DateTime(wTime);
          const wTimeKey = `${dateTime.year}-${dateTime.month}-${dateTime.day}`;
          if (
            wTime.getTime() >= new Date(filter.$gte).getTime() &&
            wTime.getTime() <= new Date(filter.$lt).getTime()
          ) {
            if (!jobList.has(wTimeKey)) {
              jobList.set(wTimeKey, new Set());
            }
            jobList.set(wTimeKey, jobList.get(wTimeKey).add(job));
          }
        });
      }
    });
    const data = {} as any;
    jobList.forEach((_job, date) => {
      data[date] = { dots: Array.from(_job) };
    });
    res.send(data);
  }

  @rescuable
  async _delete(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const {
      params: { id },
    } = req;
    const worker = await this.users.findOne(id.toString(), {
      roles: EROLES.worker,
    });
    if (!worker) {
      res.status(404).send({ message: `worker with id=${id} not exists` });
      return;
    }
    worker.deletedAt = new Date();
    await worker.save();
    res.send({ success: true });
  }

  @rescuable
  async _addTrace(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (!req.body.trace || !Array.isArray(req.body.trace)) {
      res.status(400).send({ message: '"trace" must be an array' });
      return;
    }
    if (!req.user.roles || !req.user.roles.includes(EROLES.worker)) {
      res.status(403).send({ message: "Only workers can add trace" });
      return;
    }
    for (let i = 0; i < req.body.trace.length; i++) {
      await this.trace.customCreate(
        {
          location: { lat: req.body.trace[i].lat, lng: req.body.trace[i].lng },
          workerId: ObjectId(req.user.id),
          createdAt: req.body.trace[i].date,
        },
        WorkerTrace.permitedAttributes
      );
    }

    res.send({ success: true });
  }

  @rescuable
  async _getTrace(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    let query = {} as any;
    if (req.user.roles.includes(EROLES.worker)) {
      query = { workerId: ObjectId(req.user.id) } as any;
    } else if (req.query.workerId) {
      query = { workerId: ObjectId(req.query.workerId) } as any;
    } else if (!req.query.jobId) {
      res.status(400).send({ message: '"workerId" is required' });
      return;
    }

    let ids = [] as any;
    let trace = [] as any;
    let data = [] as any;

    if (req.query.jobId) {
      const job = await this.jobs.findById(ObjectId(req.query.jobId));
      const ids = [] as any;
      job.workers.forEach((_jobWorker) => {
        ids.push(_jobWorker.worker.id);
      });
      query.workerId = { $in: ids };

      trace = await this.trace.findAllNoPaginate(query);

      for (let i = trace.length - 1; i >= 0; i--) {
        if (ids.includes(trace[i].workerId.toHexString())) continue;
        ids.push(trace[i].workerId.toString());
        data.push({ ...trace[i], location: trace[i].location });
      }

      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          await this.users.findAndUpdate(
            data[i].workerId,
            { location: data[i].location },
            this.permitedAttributes
          );
        }
      }

      data = data.reduce((traces: any, trace: any) => {
        if (!traces[trace.workerId]) traces[trace.workerId] = [] as any;
        traces[trace.workerId] = [
          ...(traces[trace.workerId] as any),
          trace,
        ] as any;
        return traces as any;
      }, {});

      res.send(data);
      return;
    }

    trace = await this.trace.findAllNoPaginate(query);

    for (let i = trace.length - 1; i >= 0; i--) {
      if (ids.includes(trace[i].workerId.toHexString())) continue;
      ids.push(trace[i].workerId.toString());
      data.push({ ...trace[i], location: trace[i].location });
    }

    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        await this.users.findAndUpdate(
          data[i].workerId,
          { location: data[i].location },
          this.permitedAttributes
        );
      }
    }

    res.send(data);
  }

  @rescuable
  async _importWorkers(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const file = req.file;
    const path_file = `../../${file.path}`;

    const wb = new Excel.Workbook();
    const path = require("path");
    const filePath = path.resolve(__dirname, path_file);

    wb.xlsx
      .readFile(filePath)
      .then(async () => {
        const sh = wb.getWorksheet("Sheet1");
        try {
          wb.xlsx.writeFile("workers.xlsx");

          // Get all the rows data [1st and 2nd column]
          try {
            for (let i = 2; i <= sh.rowCount; i++) {
              if (sh.getRow(i).getCell(1).value) {
                const firstName = sh.getRow(i).getCell(1).value;
                const lastName = sh.getRow(i).getCell(2).value;
                const phoneNumber = sh.getRow(i).getCell(3).value;
                this.emailObj = sh.getRow(i).getCell(4).value;
                const email = this.emailObj["text"];
                const type1 = sh.getRow(i).getCell(5).value;
                const type2 = sh.getRow(i).getCell(6).value;
                const type3 = sh.getRow(i).getCell(7).value;
                const subcontractorId = sh.getRow(i).getCell(8).value;

                const workerTypes = [];
                if (JobType[type1 as keyof typeof JobType] !== null) {
                  workerTypes.push(JobType[type1 as keyof typeof JobType]);
                }

                if (JobType[type2 as keyof typeof JobType] !== null) {
                  workerTypes.push(JobType[type2 as keyof typeof JobType]);
                }

                if (JobType[type3 as keyof typeof JobType] !== null) {
                  workerTypes.push(JobType[type3 as keyof typeof JobType]);
                }

                let user = null;

                try {
                  const password = generator.generate({
                    length: 10,
                    numbers: true,
                    excludeSimilarCharacters: true,
                  });

                  let subcontractor = null;

                  if (subcontractorId) {
                    subcontractor = ObjectId.isValid(subcontractorId)
                      ? await Subcontractor.findOne(subcontractorId as string)
                      : undefined;
                  }

                  user = await this.users
                    .customCreate(
                      {
                        firstName,
                        lastName,
                        phoneNumber,
                        email,
                        roles: [EROLES.worker],
                        password: password.toString(),
                        repeatPassword: password.toString(),
                        // tslint:disable-next-line:no-null-keyword
                        avatar: null,
                        subcontractorId,
                        workerTypes,
                        ...(subcontractor && {
                          subcontractor_name: subcontractor.name,
                        }),
                      },
                      [
                        "firstName",
                        "lastName",
                        "email",
                        "roles",
                        "password",
                        "phoneNumber",
                        "avatar",
                        "subcontractorId",
                        "workerTypes",
                        "subcontractor_name",
                      ]
                    )
                    .catch((err) => {
                      const errorMessage = new ErrorMessage(
                        "invalid key",
                        err.errmsg,
                        []
                      );
                      res.status(400).json(errorMessage);
                    });

                  if (user) {
                    if (subcontractor) {
                      subcontractor.workerIds.push(user.id.toString());
                      await subcontractor.save();
                    } else {
                      await this.users.destroy(user.id.toString());
                      res
                        .status(400)
                        .json({ message: "Subcontractor not found" });
                    }
                    this.users.changeEmail(user, user.email, password);
                  }
                } catch (error) {
                  const errorMessage = new ErrorMessage(
                    "invalid key",
                    error.errmsg,
                    []
                  );
                  res.status(400).json(errorMessage);
                }
              }
            }
            res.status(200).json({
              message: "Import success!",
            });
          } catch (error) {
            const errorMessage = new ErrorMessage(
              "invalid key",
              error.errmsg,
              []
            );
            res.status(400).json(errorMessage);
          }
        } catch (error) {
          const errorMessage = new ErrorMessage(
            "invalid data",
            "The data in the file is in the wrong format.",
            []
          );
          res.status(400).json(errorMessage);
        }
      })
      .catch((error: { errmsg: string }) => {
        const errorMessage = new ErrorMessage("invalid data", error.errmsg, []);
        res.status(400).json(errorMessage);
      });
  }

  get permitedAttributes() {
    return [
      "firstName",
      "lastName",
      "email",
      "departments",
      "location",
      "roles",
      "password",
      "phoneNumber",
      "subcontractorId",
      "avatar",
      "fcmToken",
      "isActive",
      "isApproved",
      "workingHours",
      "timezone",
      "workerTypes",
      "subcontractor_name",
    ];
  }
}

import * as express from "express";
import { inject, injectable } from "inversify";

import ApplicationController from "./applicationController";
import { SystemLogger } from "@loggers";
import { TYPES } from "@commons";
import { NotificationRepositoryImpl } from "@repositories";
import { rescuable } from "@commons/decorators";
import { getCustomRepository } from "typeorm";
import passport from "passport";
import { EROLES } from "../constants";
import { notifiableTypes } from "../entities/notification";
import { Job } from "../entities";
const { ObjectId } = require("mongodb");

@injectable()
export class NotificationController extends ApplicationController {
  logger: SystemLogger;
  notifications: NotificationRepositoryImpl;

  constructor(
    @inject(TYPES.SystemLogger) _logger: SystemLogger,
  ) {
    super(_logger);
    this.notifications = getCustomRepository(NotificationRepositoryImpl);
  }

  register(app: express.Application): void {
    super.register(app);

    const router = express.Router();
    router.all("*", passport.authenticate("jwt", { session: false }));

    app.use("/notifications", router);

    router.route("/").get(this._index);
    router.route("/").put(this._markAsRead);
  }

  @rescuable
  async _index(req: express.Request, res: express.Response, next: express.NextFunction) {
    const query = {} as any;
    let forWorker = false;
    if (req.user.roles && req.user.roles.includes(EROLES.worker)) {
      query.notifiableType = { $in: [notifiableTypes.CREATE_JOB, notifiableTypes.CANCEL_JOB] };
      forWorker = true;
    }
    query.userId = req.user.id.toString();
    if (req.query.page) {
      query.page = req.query.page;
    }
    req.query = {};
    const notifications = await this.notifications.findAll(req, query);
    console.log({ notifications: notifications.results[0] });
    if (!forWorker) {
      res.send(notifications);
      return;
    }
    const data = [] as any;
    for (let i = 0; i < notifications.results.length; i++) {
      const notification = notifications.results[i];
      const notifiableIdx = notification.notifiable.findIndex(_notifiable => _notifiable.userId === req.user.id.toString());
      if (notifiableIdx === -1) {
        continue;
      }
      if (!<Job>notification.notifiableRecord) {
        continue;
      }
      const job = <Job>notification.notifiableRecord;
      const workerIndex = job.workers.findIndex(worker => worker.workerId === req.user.id.toString());
      if (workerIndex === -1) {
        continue;
      }
      data.push({ ...job.workerView(job.workers[workerIndex]), isRead: notification.notifiable[notifiableIdx].isRead, notificationId: notification.id, createdAt: notification.createdAt });
    }
    res.send({
      results: data,
      total: notifications.total,
      page: notifications.page,
      limit: notifications.limit
    });
  }

  @rescuable
  async _markAsRead(req: express.Request, res: express.Response, next: express.NextFunction) {
    const query = {} as any;
    if (req.body.id && ObjectId.isValid(req.body.id)) {
      query._id = new ObjectId(req.body.id);
    }
    query.notifiable = { "$elemMatch": { userId: req.user.id.toString() } };
    req.query = {};
    const notifications = await this.notifications.findAllNoPaginate(query);
    for (let i = 0; i < notifications.length; i++) {
      const _notification = notifications[i];
      const notifiableIdx = _notification.notifiable.findIndex(_notifiable => _notifiable.userId === req.user.id.toString());
      _notification.notifiable[notifiableIdx].isRead = true;
      await _notification.save();
    }
    res.status(200).json({ success: true });
  }
}


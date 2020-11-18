import * as express from "express";
import { injectable, inject } from "inversify";

import ApplicationController from "./applicationController";
import { SystemLogger } from "@loggers";
import { TYPES } from "@commons";
import { UserRepositoryImpl } from "@repositories";
import { rescuable } from "@commons/decorators";
import { getCustomRepository } from "typeorm";
import { EROLES } from "@constants";
import multer = require("multer");

@injectable()
export class RequestorController extends ApplicationController {
  logger: SystemLogger;
  users: UserRepositoryImpl;

  constructor(@inject(TYPES.SystemLogger) _logger: SystemLogger) {
    super(_logger);
    this.users = getCustomRepository(UserRepositoryImpl);
  }

  register(app: express.Application, upload: multer.Instance): void {
    super.register(app);

    const router = express.Router();
    app.use("/requestors", router);

    router.route("/").get(this._index);
  }

  @rescuable
  async _index(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const query = { roles: EROLES.requestor } as any;
    if (req.query.firstName) {
      query.firstName = { $regex: new RegExp(req.query.firstName), $options: "si" };
    }
    if (req.query.page) {
      req.query = { page: req.query.page };
    } else {
      req.query = {};
    }
    res.send(
      await this.users.findAll(req, query)
    );
  }
}
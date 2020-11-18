import { TYPES } from "@commons";
import { DEPARTMENTS } from "@constants";
import * as express from "express";
import { inject, injectable } from "inversify";
import { SystemLogger } from "loggers";
import ApplicationController from "./applicationController";

@injectable()
export class DepartmentController extends ApplicationController {
  constructor(@inject(TYPES.SystemLogger) _logger: SystemLogger) {
    super(_logger);
  }

  register(app: express.Application): void {
    const router = express.Router();
    app.use("/departments", router);

    router.route("/").get(async (req, res) => {
      res.status(200).json(DEPARTMENTS);
    });
  }
}

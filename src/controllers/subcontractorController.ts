import { TYPES } from "@commons";
import { rescuable } from "@commons/decorators";
import { SystemLogger } from "@loggers";
import { SubcontractorRepositoryImpl, UserRepositoryImpl } from "@repositories";
import * as express from "express";
import { inject, injectable } from "inversify";
import { getCustomRepository } from "typeorm";
import ApplicationController from "./applicationController";
import { EROLES } from "@constants";

@injectable()
export class SubcontractorController extends ApplicationController {
  logger: SystemLogger;
  subcontractor: SubcontractorRepositoryImpl;
  user: UserRepositoryImpl;

  constructor(@inject(TYPES.SystemLogger) _logger: SystemLogger) {
    super(_logger);
    this.subcontractor = getCustomRepository(SubcontractorRepositoryImpl);
    this.user = getCustomRepository(UserRepositoryImpl);
  }

  register(app: express.Application): void {
    super.register(app);
    const router = express.Router();
    app.use("/subcontractors", router);

    router.route("/").post(this._add);
    router.route("/").get(this._findAll);
    router.route("/:id").put(this._update);
    router.route("/:keyword").get(this._find);
  }

  @rescuable
  async _add(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const pass = Date.now().toString();
    const attributes = {
      ...req.body,
      password: pass,
      roles: [EROLES.subcontractor],
      repeatPassword: pass,
    };
    this.generateUploadFileAttrs(req);
    const user = await this.user.customCreate(
      attributes,
      this.permitedAttributes
    );
    const contractor = await this.subcontractor.customCreate(
      {
        subcontractorId: user.id,
        contractor: user,
        companyName: req.body.companyName,
      },
      this.SubPermitedAttributes
    );
    res.send(contractor);
  }

  @rescuable
  async _update(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const attrs = req.body;

    const sub = await this.subcontractor.findById(req.params.id);
    if (attrs.workerIds && attrs.workerIds.length > 0) {
      const newData = [];
      for (let i = 0; i < attrs.workerIds.length; i++) {
        const el = attrs.workerIds[i];
        const worker = await this.user.findById(el);
        newData.push(worker);
      }
      attrs.workerIds = newData;
    }
    res.send(
      await this.subcontractor.customUpdate(sub, attrs, this.permitedAttributes)
    );
  }

  @rescuable
  async _findAll(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    let query = {} as any;
    if (req.query.firstName) {
      query["contractor.firstName"] = {
        $regex: new RegExp(req.query.firstName),
        $options: "si",
      };
    }
    if (req.query.lastName) {
      query["contractor.lastName"] = {
        $regex: new RegExp(req.query.lastName),
        $options: "si",
      };
    }
    if (req.query.email) {
      query = {
        ...query,
        "contractor.email": {
          $regex: new RegExp(req.query.email),
          $options: "si",
        },
      };
    }
    if (!isNaN(+req.query.workers) && +req.query.workers >= 0) {
      query.workers = { $size: +req.query.workers };
    }
    if (req.query.phoneNumber) {
      query = {
        ...query,
        "contractor.phoneNumber": {
          $regex: new RegExp(req.query.phoneNumber),
          $options: "si",
        },
      };
    }
    if (req.query.companyName) {
      query = {
        ...query,
        companyName: {
          $regex: new RegExp(req.query.companyName),
          $options: "si",
        },
      };
    }
    if (req.query.page) {
      req.query = { page: req.query.page };
    } else {
      req.query = {};
    }
    const subcontractors = await this.subcontractor.findAll(req, query);
    for (let i = 0; i < subcontractors.results.length; i++) {
      const el = subcontractors.results[i];
      subcontractors.results[i].workers = await subcontractors.results[
        i
      ].loadWorkers();
    }
    res.send(subcontractors);
  }

  @rescuable
  async _find(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    res.send(await this.subcontractor.findAll(req));
  }

  get permitedAttributes() {
    return [
      "firstName",
      "lastName",
      "email",
      "departments",
      "roles",
      "password",
      "phoneNumber",
      "subcontractor_id",
      "avatar",
      "workerIds",
    ];
  }

  get SubPermitedAttributes() {
    return [
      "subcontractorId",
      "workers",
      "contractor",
      "workerIds",
      "companyName",
    ];
  }
}

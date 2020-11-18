import { injectable, inject } from "inversify";
import * as express from "express";

import { SystemLogger } from "loggers";
import { UserRepository, UserRepositoryImpl } from "@repositories";
import { TYPES } from "@commons";
import { isAllowed } from "@policies";
import ApplicationController from "./applicationController";
import { getCustomRepository } from "typeorm";
import { ROLES } from "@constants";

@injectable()
export class RolesController extends ApplicationController {
  logger: SystemLogger;
  users: UserRepository;

  constructor(
    @inject(TYPES.SystemLogger) _logger: SystemLogger,
  ) {
    super(_logger);
    this.users = getCustomRepository(UserRepositoryImpl);
  }

  register(app: express.Application): void {
    const router = express.Router();
    app.use("/roles", router);

    // router.all("*", passport.authenticate("jwt", { session: false }));

    router.route("/").get(async (req, res) => {
      res.status(200).json(ROLES);
    });

    router.route("/:userId/approve").put(isAllowed, async (req, res) => {
      const { userId } = req.params;
      const user = await this.users.approve(userId);

      res.status(200).json(user);
    });
  }
}

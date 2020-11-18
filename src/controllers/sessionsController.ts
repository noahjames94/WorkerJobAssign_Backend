import { injectable, inject } from "inversify";
import * as express from "express";
import * as jwt from "jsonwebtoken";
import passport from "passport";

import ApplicationController from "./applicationController";
import { SystemLogger } from "@loggers";
import { UserRepository, UserRepositoryImpl } from "@repositories";
import { TYPES, rescuable } from "@commons";
import { getCustomRepository } from "typeorm";

@injectable()
export class SessionsController extends ApplicationController {
  logger: SystemLogger;
  users: UserRepository;

  constructor(
    @inject(TYPES.SystemLogger) _logger: SystemLogger
  ) {
    super(_logger);
    this.users = getCustomRepository(UserRepositoryImpl);
  }

  register(app: express.Application) {
    super.register(app);

    const router = express.Router();
    app.use("/sessions", router);
    router.route("/").post(this._login);
  }

  @rescuable
  private _login(req: express.Request, res: express.Response) {
    passport.authenticate("local", { session: false }, (err, user) => {
      if (err || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user
        });
      }

      req.login(user, { session: false }, err => {
        if (err) {
          return res.send(err).end();
        }

        const payload = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.TOKEN_EXPIRE || 36000 });

        return res.status(200).json({ token, payload });
      });
    })(req, res);
  }
}

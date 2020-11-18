import * as express from "express";
import { injectable, inject } from "inversify";
import { Mailer } from "mails";
import multer = require("multer");
import passport from "passport";
import * as jwt from "jsonwebtoken";

import ApplicationController from "./applicationController";
import { SystemLogger } from "@loggers";
import { TYPES } from "@commons";
import { SubcontractorRepositoryImpl, UserRepositoryImpl } from "@repositories";
import { ErrorMessage } from "@models";
import { rescuable } from "@commons/decorators";
import { getCustomRepository } from "typeorm";
import { EROLES, APPROVE, ROLES, DEPARTMENTS, ACTIVE } from "@constants";
import Excel from "exceljs";
import { User } from "entities";
const generator = require("generate-password");
const { ObjectId } = require("mongodb");

@injectable()
export class UserController extends ApplicationController {
  logger: SystemLogger;

  mailer: Mailer;

  users: UserRepositoryImpl;
  subcontractor: SubcontractorRepositoryImpl;

  emailObj: any;

  constructor(
    @inject(TYPES.SystemLogger) _logger: SystemLogger,
    @inject(TYPES.Mailer) _mailer: Mailer
  ) {
    super(_logger);
    this.users = getCustomRepository(UserRepositoryImpl);
    this.mailer = _mailer;
    this.subcontractor = getCustomRepository(SubcontractorRepositoryImpl);
  }

  register(app: express.Application, upload: multer.Instance): void {
    super.register(app);
    const router = express.Router();
    app.use("/user", router);

    router.route("/login").post(this._login);
    router.route("/track").post(this.track);

    router
      .route("/")
      .get(passport.authenticate("jwt", { session: false }), this.getMe);

    router.route("/role").post(upload.single("avatar"), this._createRole);

    router
      .route("/import-excel")
      .post(upload.single("excel"), this._importUsers);

    router.route("/signup").post(upload.single("avatar"), this._signup);

    router.route("/create").post(upload.single("avatar"), this._create);

    router.route("/activate").get(this._activate);

    router.route("/approve").post(this._approve);

    router.route("/:id/delete").delete(this._delete);

    router.route("/password-forgot").post(this._passwordForgot);

    router.route("/password-restore/:token").post(this._passwordRestore);

    router.route("/users").get(this._findUsers);

    router.route("/:id").get(this._findUser);

    router
      .route("/")
      .put(
        passport.authenticate("jwt", { session: false }),
        upload.single("avatar"),
        this.update
      );
    // .put(
    //   [
    //     passport.authenticate("jwt", { session: false }),
    //     upload.single("avatar"),
    //   ],
    //   this.update
    // );
  }

  @rescuable
  async track(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    res.send({ fuck: true });
  }

  @rescuable
  async _findUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const { id } = req.params;
    const userData = await this.users.findById(id);

    const WORKER_TYPE = [
      {
        label: "Parking",
        value: 1,
      },
      {
        label: "Flagging",
        value: 0,
      },
      {
        label: "Signage",
        value: 2,
      },
    ];

    if (userData.workerTypes) {
      const data = [];
      for (let i = 0; i < WORKER_TYPE.length; i++) {
        const el = WORKER_TYPE[i];
        for (let j = 0; j < userData.workerTypes.length; j++) {
          const item = userData.workerTypes[j];
          if (el.value === item) {
            data.push(WORKER_TYPE[i]);
          }
        }
      }

      userData.workerTypesDefault = data;
    }

    if (userData.subcontractorId) {
      const subcontractor = await this.subcontractor.findById(
        userData.subcontractorId
      );
      userData.subcontractor = subcontractor;
    }

    return res.send(userData);
  }

  @rescuable
  async _findUsers(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    let query = {} as any;
    const status = req.query.status;
    if (status && typeof status === "string") {
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
        case "1":
          statusQ = { isActive: ACTIVE.active };
          break;
      }
      if (statusQ !== {}) {
        query = { ...query, ...statusQ };
      }
    }
    if (req.query.firstName && req.query.firstName !== "") {
      query.firstName = {
        $regex: new RegExp(req.query.firstName),
        $options: "si",
      };
    }
    if (req.query.subcontractorName) {
      query.subcontractorName = {
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
    if (req.query.roles && Array.isArray(req.query.roles)) {
      query.roles = {
        $in: req.query.roles.map((role: any) => {
          if (!isNaN(role)) {
            return +role;
          }
        }),
      };
    }

    if (req.query.statuses && Array.isArray(req.query.statuses)) {
      query.isApproved = {
        $in: req.query.statuses.map((status: any) => {
          if (!isNaN(status)) {
            return +status;
          }
        }),
      };
    }

    if (req.query.page) {
      req.query = { page: req.query.page };
    } else {
      req.query = {};
    }
    res.send(await this.users.findAll(req, query));
  }

  @rescuable
  _login(req: express.Request, res: express.Response) {
    passport.authenticate("local", { session: false }, (err, user: User) => {
      if (err || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user,
        });
      }
      if (user.isApproved !== APPROVE.approved) {
        return res.status(400).json({
          message: "Your account is not activated yet",
          user: user,
        });
      }
      if (req.body.authType === "admin" && user.roles.includes(EROLES.worker)) {
        const errorMessage = new ErrorMessage(
          "invalid role",
          "Worker can not be logged to admin panel",
          []
        );
        return res.status(403).json(errorMessage);
      }
      if (
        req.body.authType !== "admin" &&
        !user.roles.includes(EROLES.worker)
      ) {
        const errorMessage = new ErrorMessage(
          "invalid role",
          "Only worker can login to mobile app",
          []
        );
        return res.status(403).json(errorMessage);
      }

      req.login(user, { session: false }, (err) => {
        if (err) {
          return res.send(err).end();
        }

        const payload = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          departments:
            user.departments &&
            Array.isArray(user.departments) &&
            user.departments.map((item) => ({
              id: item.id,
              name: item.name,
            })),
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: process.env.TOKEN_EXPIRE || 36000,
        });

        return res.status(200).json({ token, payload, user });
      });
    })(req, res);
  }

  @rescuable
  async _signup(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user = await this.users.customCreate(
      {
        ...req.body,
        avatar: this.getUploadFilesPath(req),
      },
      [
        "firstName",
        "lastName",
        "email",
        "departments",
        "roles",
        "password",
        "phoneNumber",
        "avatar",
      ]
    );
    const url = `${process.env.API_HOST}/user/activate?token=${user.activateToken}`;
    // TODO: recomment this
    // this.mailer.send(user.email, { url }, "activations");
    this.mailer.send(
      user.email,
      { url, username: `${user.firstName}` },
      "activations"
    );

    res.send();
  }

  @rescuable
  async _importUsers(
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
          wb.xlsx.writeFile("users.xlsx");

          // Get all the rows data [1st and 2nd column]
          try {
            for (let i = 2; i <= sh.rowCount; i++) {
              if (sh.getRow(i).getCell(1).value) {
                const firstName = sh.getRow(i).getCell(1).value;
                const lastName = sh.getRow(i).getCell(2).value;
                const phoneNumber = sh.getRow(i).getCell(3).value;
                this.emailObj = sh.getRow(i).getCell(4).value;
                const email = this.emailObj["text"];
                const role1 = sh.getRow(i).getCell(5).value;
                const role2 = sh.getRow(i).getCell(6).value;

                const role1Index = ROLES.filter((el) => el.name === role1)[0];
                const role2Index =
                  role2 !== "NA" && ROLES.filter((el) => el.name === role2)[0];

                let user = undefined;

                const departments = [];

                for (let index = 7; index < 33; index++) {
                  // 26 columns of department
                  const value = sh.getRow(i).getCell(index).value;
                  if (value === "x") {
                    const columnName = sh.getRow(1).getCell(index).value;
                    const dept = DEPARTMENTS.find(
                      (_deparment) => _deparment.name === columnName
                    );
                    if (dept) {
                      departments.push(dept);
                    }
                  }
                }
                try {
                  const password = generator.generate({
                    length: 10,
                    numbers: true,
                    excludeSimilarCharacters: true,
                  });
                  user = await this.users
                    .customCreate(
                      {
                        firstName,
                        lastName,
                        phoneNumber,
                        email,
                        roles: role2Index
                          ? [role1Index.id, role2Index.id]
                          : [role1Index.id],
                        password: password.toString(),
                        repeatPassword: password.toString(),
                        // tslint:disable-next-line:no-null-keyword
                        avatar: null,
                        departments,
                      },
                      [
                        "firstName",
                        "lastName",
                        "email",
                        "departments",
                        "roles",
                        "password",
                        "phoneNumber",
                        "avatar",
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
                    const url = `${process.env.API_HOST}/user/activate?token=${user.activateToken}`;

                    this.mailer.send(
                      user.email,
                      {
                        url,
                        username: user.firstName,
                        password: password.toString(),
                      },
                      "activations"
                    );
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

  @rescuable
  async _createRole(
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

    if (attributes.roles && attributes.roles.length) {
      attributes.roles = attributes.roles.map((id: any) => parseInt(id, 10));
    }

    this.generateUploadFileAttrs(req);
    const userRole = await this.users.customCreate(attributes, [
      "firstName",
      "lastName",
      "email",
      "departments",
      "roles",
      "password",
      "phoneNumber",
      "avatar",
    ]);

    this.users.changeEmail(userRole, userRole.email, attributes.password);
    res.status(201).end();
  }

  @rescuable
  async _create(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const _user = req.body;
    if (!_user.password) {
      const password = new Date().getTime().toString();
      _user.password = password;
      _user.repeatPassword = password;
    }
    const user = await this.users.customCreate(
      {
        ..._user,
        avatar: this.getUploadFilesPath(req),
      },
      [
        "firstName",
        "lastName",
        "email",
        "departments",
        "roles",
        "password",
        "phoneNumber",
        "avatar",
      ]
    );
    const url = `${process.env.API_HOST}/user/activate?token=${user.activateToken}`;
    // TODO: recomment this
    this.mailer.send(
      user.email,
      { url, username: `${user.firstName}` },
      "activations"
    );

    res.send();
  }

  @rescuable
  async _passwordRestore(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const { token } = req.params;
    const { password } = req.body;
    const user = await this.users.findByRestoreToken(token);

    if (!user) {
      const errorMessage = new ErrorMessage(
        "invalid token",
        "Your restore token is invalid",
        []
      );

      res.status(400).json(errorMessage);
    } else {
      await this.users.restore(user, password);
      res.status(200).end();
    }
  }

  @rescuable
  async _passwordForgot(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const { email } = req.body;

    if (!email) {
      const errorMessage = new ErrorMessage(
        "invalid email",
        "Your email is empty",
        []
      );
      res.status(400).json(errorMessage);
    }

    const user = await this.users.findOne({ email });
    if (!user) {
      const errorMessage = new ErrorMessage(
        "user not found",
        "User with this email does not exist",
        []
      );

      res.status(404).json(errorMessage);
    } else {
      const token: string = await this.users.generateRestoreToken(user);
      const url = `${process.env.CLIENT_DOMAIN}/restore/${token}`;
      this.mailer.send(
        user.email,
        { url, username: `${user.name}` },
        "forgotPassword"
      );
      res.status(200).end();
    }
  }

  @rescuable
  async _approve(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const { id, approve = APPROVE.waiting } = req.body;

    const user = await this.users.approve(id, approve);
    if (user.isApproved === APPROVE.rejected) {
      this.mailer.send(user.email, {}, "rejected");
    }
    if (user.isApproved === APPROVE.approved) {
      this.mailer.send(
        user.email,
        { url: `${process.env.CLIENT_DOMAIN}/login` },
        "activated"
      );
    }

    res.status(200).end();
  }

  @rescuable
  async _delete(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    await this.users.destroy(req.params.id);

    res.status(200).end();
  }

  @rescuable
  async _activate(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const { token } = req.query;
    const user = await this.users.findByActivateToken(token);

    if (!user) {
      const errorMessage = new ErrorMessage(
        "invalid token",
        "Your activate token is invalid",
        []
      );

      res.status(400).json(errorMessage);
    } else {
      this.users.activate(user);

      let isWorker = false;
      if (
        user.roles &&
        user.roles.length > 0 &&
        user.roles.findIndex(
          (item: number) =>
            item !== EROLES.worker && item !== EROLES.ces_field_supervisor
        ) < 0
      ) {
        isWorker = true;
      }

      if (isWorker) {
        return res.redirect(
          301,
          `${process.env.CLIENT_DOMAIN}/login/activateworker`
        );
      } else {
        return res.redirect(301, `${process.env.CLIENT_DOMAIN}/login/activate`);
      }
    }
  }

  @rescuable
  async getMe(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    return res.send(req.user);
  }

  @rescuable
  async update(
    req: express.Request | any,
    res: express.Response,
    next: express.NextFunction
  ) {
    const dataBody: any = {};

    for (const item in req.body) {
      const value = req.body[item];
      if (!Array.isArray(value)) {
        dataBody[item] = JSON.parse(value);
      } else {
        dataBody[item] = value;
      }
    }

    if (!req.user || !req.user.id) {
      res.status(401).end();
      return;
    }
    let user = await this.users.findById(req.user.id);

    if (!user) {
      const errorMessage = new ErrorMessage(
        "invalid user",
        "Unexpected Error",
        []
      );
      return res.status(400).json(errorMessage);
    } else {
      if (dataBody.password) {
        await this.users.restore(user, dataBody.password);
        delete dataBody.password;
      }
      if (dataBody.email && dataBody.email !== user.email) {
        await this.users.changeEmail(user, dataBody.email);
        delete dataBody.email;
      }

      if (dataBody.notification) {
        user.notification = dataBody.notification;
      }

      if (req.file) {
        user.avatar = req.file.path;
      }

      user = await this.users.customUpdate(
        user,
        { ...dataBody },
        this.permitedAttributes
      );
      res.send(user);
    }
  }

  get permitedAttributes() {
    return [
      "firstName",
      "lastName",
      "departments",
      "password",
      "phoneNumber",
      "fcmToken",
      "location",
      "avatar",
      "workingHours",
      "timezone",
      "enableNotification",
      "notification",
    ];
  }
}

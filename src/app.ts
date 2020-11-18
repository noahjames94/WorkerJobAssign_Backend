import "reflect-metadata";
require("dotenv").config();
import express from "express";
import { injectable, Container } from "inversify";
import * as dotenv from "dotenv";
import path from "path";
import * as bodyParser from "body-parser";
import methodOverride from "method-override";
import chalk from "chalk";
import cors from "cors";

import { TYPES } from "@commons";
import generateContainer from "./container";
import { RegisterableController } from "@controllers";
import { Strategy } from "@infrastructures/passport";
import { ApplicationError, DuplicateValueError } from "@commons/errors";
import { invokePolicies } from "@policies";
import multer = require("multer");
import { User, Subcontractor, UploadFile, Invoice, IncrementIndex, Job, Notification, Timesheet, WorkerTrace } from "@entities";
import { Connection, createConnection } from "typeorm";
import NotificationsServer from "./services/notificationsServer";
import CronScheduler from "./services/cronScheduler";
import CronUpdatingJobStatusToInProgress from "./services/cron-job/updateJobStatusToInProgress";
import { MailerImpl } from "@mails";

process.env.TZ = "UTC";
const moment = require("moment-timezone");
// SET DEFAULT TIMEZONE TO UTC
moment.tz.setDefault("UTC");
dotenv.config();

@injectable()
class App {
  public express: any;
  public upload: multer.Instance;
  public container: Container;
  public connection: Connection;
  public io: any;
  public notificationServer: Promise<NotificationsServer>;

  constructor() {
    this.express = express();
    this.express.use("/storage", express.static(path.join(__dirname, "../storage")));
    this.express.use(cors());
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: true }));

    this.upload = this.multerSotrage();

    this.express.all("/", cors(), function (errors: any, req: any, res: any, next: any) {
      res.header("Access-Control-Allow-Origin", "*");
      next();
    });

    this.notificationServer = this.connectSocketIo();
    CronScheduler.setupTasks();
    CronUpdatingJobStatusToInProgress.setupTasks();
    this.initApp();
  }

  async initApp() {
    await this.connectDB();

    this.container = generateContainer();


    this.mountRoutes();
    this.mountPassportStrategies();
    this.mountPolicies();
    this.express.use(methodOverride());
    this.express.use(this.errorHandler.bind(this));
  }

  async connectSocketIo() {
    return new Promise<NotificationsServer>((resolve, reject) => {
      try {
        if (!process.env.NOTIFICATIONS_PORT) {
          return;
        }
        const http = require("http").createServer(this.express);
        this.io = require("socket.io")(http);
        http.listen(process.env.NOTIFICATIONS_PORT, () => {
          const notificationServer = new NotificationsServer(this.io);
          notificationServer.start();
          console.log("Notifications started on: " + process.env.NOTIFICATIONS_PORT);
          resolve(notificationServer);
        });
      } catch (error) {
        console.error("Cannot connect to Notifications sSocket", error);
        reject(error);
      }
    });
  }

  async connectDB() {
    try {
      const entities = [User, Subcontractor, UploadFile, Invoice, IncrementIndex, Notification, Job, Timesheet, WorkerTrace];
      this.connection = await createConnection({
        type: "mongodb",
        host: `${process.env.DB_HOST}`,
        port: parseInt(`${process.env.DB_PORT || 27017}`, 10),
        database: `${process.env.DB_DATABASE_NAME}`,
        entities,
        synchronize: true
      });
    } catch (error) {
      console.error("Cannot connect to database", error);
    }
    console.log(chalk.green("Database connected!"));
  }

  private multerSotrage(): multer.Instance {
    const dest = "storage/";
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(undefined, dest);
      },
      filename: function (req, file, cb) {
        cb(undefined, `${file.fieldname}-${Date.now()}-${file.originalname}`);
      }
    });

    return multer({ storage: storage });
  }

  private errorHandler(errors: any, req: any, res: any, next: any): void {
    if (errors) {
      switch (true) {
        case errors instanceof ApplicationError:
          console.log(errors.errorMessage);
          res.status(errors.status).json(errors.errorMessage);
          break;
        case errors.name === "BulkWriteError" && errors.err.code === 11000:
          this.errorHandler(new DuplicateValueError({ errors }), req, res, next);
          break;
        default:
          res.status(500).json(errors);
          console.error(chalk.red(errors));
          throw errors;
      }
    } else next(...arguments);
  }

  private mountRoutes(): void {
    const controllers: RegisterableController[] = this.container.getAll<RegisterableController>(TYPES.Controller);

    controllers.forEach(controller => controller.register(this.express, this.upload));
  }

  private mountPassportStrategies(): void {
    const strategies: Strategy[] = this.container.getAll<Strategy>(TYPES.Strategy);

    strategies.forEach(strategy => {
      strategy.register(this.express);
    });
  }

  private mountPolicies(): void {
    invokePolicies();
  }

}

const app = new App();

export const connection = app.connection;

export const notifyServer = app.notificationServer;

export const mailer = new MailerImpl();

export default app.express;

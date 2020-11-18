import { Container } from "inversify";
import { TYPES } from "@commons";
import {
  UserController,
  RolesController,
  DepartmentController,
  WorkerController,
  FilesContoller,
  SubcontractorController,
  NotificationController,
  SessionsController,
  JobController,
  TimesheetContoller,
  InvoiceController,
  RequestorController,
} from "@controllers";
import { MongoDbContextImpl, MongoDbContext } from "@connectors";

import { SystemLoggerImpl, SystemLogger } from "@loggers";
import { Mailer, MailerImpl } from "@mails";
import { Strategy, JwtStrategyImpl } from "@infrastructures/passport";
import chalk from "chalk";

export default (): Container => {
  const container = new Container();
  container.bind<MongoDbContext>(TYPES.MongoDbContext).to(MongoDbContextImpl);
  container.bind<SystemLogger>(TYPES.SystemLogger).to(SystemLoggerImpl);
  container.bind<Mailer>(TYPES.Mailer).to(MailerImpl);

  /***
   * Controllers
   */
  container.bind<UserController>(TYPES.Controller).to(UserController);
  container.bind<RolesController>(TYPES.Controller).to(RolesController);
  container
    .bind<DepartmentController>(TYPES.Controller)
    .to(DepartmentController);
  container.bind<WorkerController>(TYPES.Controller).to(WorkerController);
  container.bind<FilesContoller>(TYPES.Controller).to(FilesContoller);
  container
    .bind<SubcontractorController>(TYPES.Controller)
    .to(SubcontractorController);
  container
    .bind<NotificationController>(TYPES.Controller)
    .to(NotificationController);
  container.bind<SessionsController>(TYPES.Controller).to(SessionsController);
  container.bind<JobController>(TYPES.Controller).to(JobController);
  container.bind<TimesheetContoller>(TYPES.Controller).to(TimesheetContoller);
  container.bind<InvoiceController>(TYPES.Controller).to(InvoiceController);
  container.bind<RequestorController>(TYPES.Controller).to(RequestorController);

  /***
   * Repositories
   */

  container.bind<Strategy>(TYPES.Strategy).to(JwtStrategyImpl);

  console.log(chalk.green("Inversify containers are ready!"));

  return container;
};

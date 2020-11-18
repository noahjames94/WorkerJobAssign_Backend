import "reflect-metadata";
import { Timesheet } from "@entities";
import { TimesheetRepository } from "@repositories";
import { EntityRepository } from "typeorm";

import { ApplicationRepositoryImpl } from "../applicationRepository";

@EntityRepository(Timesheet)
export class TimesheetRepositoryImpl extends ApplicationRepositoryImpl<Timesheet> implements TimesheetRepository {
  EntityType = Timesheet;
}

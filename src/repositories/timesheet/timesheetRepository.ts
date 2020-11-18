import { Timesheet } from "@entities";
import { ApplicationRepository } from "@repositories/applicationRepository";

export interface TimesheetRepository extends ApplicationRepository<Timesheet> {
}

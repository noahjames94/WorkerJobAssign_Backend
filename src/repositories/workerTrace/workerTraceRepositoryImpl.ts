import "reflect-metadata";
import { EntityRepository } from "typeorm";

import { ApplicationRepositoryImpl } from "../applicationRepository";
import { WorkerTrace } from "../../entities/workerTrace";
import { WorkerTraceRepository } from "./workerTraceRepository";

@EntityRepository(WorkerTrace)
export class WorkerTraceRepositoryImpl extends ApplicationRepositoryImpl<WorkerTrace> implements WorkerTraceRepository {
  EntityType = WorkerTrace;
}

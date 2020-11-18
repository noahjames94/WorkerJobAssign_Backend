import { ApplicationRepository } from "@repositories/applicationRepository";
import { WorkerTrace } from "../../entities/workerTrace";

export interface WorkerTraceRepository extends ApplicationRepository<WorkerTrace> {
}

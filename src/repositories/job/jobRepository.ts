import { Job } from "@entities";
import { ApplicationRepository } from "@repositories/applicationRepository";

export interface JobRepository extends ApplicationRepository<Job> {
}

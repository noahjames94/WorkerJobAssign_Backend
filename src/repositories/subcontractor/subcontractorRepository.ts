import { Subcontractor } from "@entities";
import { ApplicationRepository } from "@repositories/applicationRepository";
import { UpdateResult, ObjectID } from "typeorm";

export interface SubcontractorRepository extends ApplicationRepository<Subcontractor> {
  findByKeyword(keyword: string): Promise<Subcontractor[]>;
  add(userId: ObjectID): Promise<Subcontractor>;
  update(contractor: Subcontractor): Promise<UpdateResult>;
}

import { Subcontractor } from "@entities";
import { ApplicationRepositoryImpl } from "@repositories/applicationRepository";
import { EntityRepository, UpdateResult, ObjectID } from "typeorm";

import { SubcontractorRepository } from "./subcontractorRepository";

@EntityRepository(Subcontractor)
export class SubcontractorRepositoryImpl extends ApplicationRepositoryImpl<Subcontractor> implements SubcontractorRepository {
  EntityType = Subcontractor;

  async findByKeyword(keyword: string): Promise<Subcontractor[]> {
    return this.repository
      .find({
        where: [
          { user: { email: keyword } },
          { user: { phone: keyword } },
          { user: { firstName: keyword } },
          { user: { lastName: keyword } }
        ]
      });
  }

  async add(userId: ObjectID): Promise<Subcontractor> {
    const newSubconstractor = new Subcontractor({ "subcontractorId": userId });
    return <Subcontractor> await this.repository.save(newSubconstractor);
  }

  async update(contractor: Subcontractor): Promise<UpdateResult> {
    return await this.repository.update({ subcontractorId: contractor.subcontractorId }, contractor);
  }
}

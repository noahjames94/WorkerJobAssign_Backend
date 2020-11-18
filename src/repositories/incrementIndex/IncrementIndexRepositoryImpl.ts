import { IncrementIndex } from "@entities";
import { ApplicationRepositoryImpl } from "@repositories/applicationRepository";
import { EntityRepository, UpdateResult } from "typeorm";

import { IncrementIndexRepository } from "./IncrementIndexRepository";

@EntityRepository(IncrementIndex)
export class IncrementIndexRepositoryImpl extends ApplicationRepositoryImpl<IncrementIndex> implements IncrementIndexRepository {
    EntityType = IncrementIndex;

    async add(index: IncrementIndex): Promise<IncrementIndex> {
        return await this.repository.save(index);
    }

    async update(index: IncrementIndex): Promise<UpdateResult> {
        return await this.repository.update(index.entityName, index);
    }

    async find(index: IncrementIndex): Promise<IncrementIndex> {
        return await this.repository.findOne({ where: [{ entityName: index.entityName }] });
    }
}

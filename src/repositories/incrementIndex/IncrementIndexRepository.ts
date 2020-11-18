import { UpdateResult } from "typeorm";
import { ApplicationRepository } from "@repositories/ApplicationRepository";
import { IncrementIndex } from "@entities";

export interface IncrementIndexRepository extends ApplicationRepository<IncrementIndex> {
    add(index: IncrementIndex): Promise<IncrementIndex>;
    update(index: IncrementIndex): Promise<UpdateResult>;
    find(index: IncrementIndex): Promise<IncrementIndex>;
}

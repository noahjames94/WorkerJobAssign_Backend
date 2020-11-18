import { Request } from "express";
import { FindConditions } from "typeorm";

export interface QueryBuilder<T> {
  build(req: Request): FindConditions<T>;
}

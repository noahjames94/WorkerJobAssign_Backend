import { MetadataObj } from "@commons";
import { Pagination } from "@paginate";
import { Request } from "express";
import { Constructable } from "@commons";
import { ObjectID, DeleteResult } from "typeorm";

export interface ApplicationRepository<T> {
  EntityType: Constructable<T>;
  findById(id: string | ObjectID): Promise<T>;
  findByIds(ids: string[] | ObjectID[]): Promise<T[]>;
  findAll(
    request: Request,
  ): Promise<Pagination<T>>;
  customCreate(args: MetadataObj, permitKeys?: Array<string>): Promise<T>;
  customUpdate(entity: T, args: MetadataObj, permitKeys?: Array<string>): Promise<T>;
  findAndUpdate(
    id: string,
    args: MetadataObj,
    permitKeys?: Array<string>,
  ): Promise<T>;
  destroy(id: string): Promise<DeleteResult>;
}

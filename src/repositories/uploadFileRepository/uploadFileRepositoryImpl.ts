import { UploadFileRepository } from "./uploadFileRepository";
import { UploadFile } from "@entities";
import { ApplicationRepositoryImpl } from "@repositories/applicationRepository";
import { EntityRepository } from "typeorm";

@EntityRepository(UploadFile)
export class UploadFileRepositoryImpl extends ApplicationRepositoryImpl<UploadFile> implements UploadFileRepository {
  EntityType = UploadFile;
}

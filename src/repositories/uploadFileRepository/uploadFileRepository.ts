import * as express from "express";
import { ApplicationRepository } from "@repositories/applicationRepository";
import { UploadFile } from "entities";

export interface UploadFileRepository extends ApplicationRepository<UploadFile> {
}

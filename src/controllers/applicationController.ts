import * as express from "express";
import { injectable, inject } from "inversify";
import forEach from "lodash/forEach";
import * as multer from "multer";
import fs from "fs";

import { RegisterableController } from "./registerableController";
import { SystemLogger } from "@loggers";
import { TYPES } from "@commons";
import { UploadFile } from "@entities";

@injectable()
export default class ApplicationController implements RegisterableController {
  logger: SystemLogger;
  [key: string]: any;

  constructor(
    @inject(TYPES.SystemLogger) _logger: SystemLogger,
  ) {
    this.logger = _logger;
  }

  register(app: express.Application, upload?: multer.Instance): void {
    this.delegateRescuableHandlers.bind(this)();
  }

  delegateRescuableHandlers() {
    forEach(this.rescuableHandlers, (value: any, name: string): void => {
      this[name] = value.bind(this);
    });
  }

  generateUploadFileAttrs(req: express.Request, { contentType }: { contentType: string } = {contentType: undefined}) {
    const { file: { path = undefined } = {} } = req;
    if (!path) return undefined;
    const file = fs.readFileSync(req.file.path);
    const encode_image = file.toString("base64");
    const uploadFile = new UploadFile();
    uploadFile.assignAttributes({
      contentType: contentType || req.file.mimetype,
      file: new Buffer(encode_image, "base64"),
    });
    return uploadFile;
  }

  getUploadFilesPaths(req: express.Request, { contentType }: { contentType: string } = {contentType: undefined}) {
    const paths = new Array<string>();
    for (const [key, _file] of Object.entries(req.files)) {
      if (_file.path) {
        paths.push(`/${_file.path}`);
      }
    }
    return paths;
  }

  getUploadFilesPath(req: express.Request, { contentType }: { contentType: string } = {contentType: undefined}) {
    const { file: { path = undefined } = {} } = req;
    if (!path) return undefined;
    return `/${req.file.path}`;
  }
}

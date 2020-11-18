import * as express from "express";
import { injectable, inject } from "inversify";

import ApplicationController from "./applicationController";
import { SystemLogger } from "@loggers";
import { TYPES } from "@commons";
import { UploadFileRepositoryImpl } from "@repositories";
import { rescuable } from "@commons/decorators";
import * as multer from "multer";
import { getCustomRepository } from "typeorm";

@injectable()
export class FilesContoller extends ApplicationController {
  uploadFiles: UploadFileRepositoryImpl;

  constructor(
    @inject(TYPES.SystemLogger) _logger: SystemLogger,
  ) {
    super(_logger);
    this.uploadFiles = getCustomRepository(UploadFileRepositoryImpl);
  }

  register(app: express.Application, upload: multer.Instance): void {
    super.register(app);
    const router = express.Router();
    app.use("/file", router);

    router.route("/image/:id").get(this._retrievingImage) ;

    router.route("/:id").get(this._retrievingFile);

    router.route("/upload").post(upload.single("file"), this._uploadPhoto);
  }

  @rescuable
  async _retrievingImage(req: express.Request, res: express.Response, next: express.NextFunction) {
    const { params: { id } } = req;
    const image = await this.uploadFiles.findById(id);
    res.contentType("image/jpeg");
    res.send(image.file.buffer);
  }

  @rescuable
  async _retrievingFile(req: express.Request, res: express.Response, next: express.NextFunction) {
    const { params: { id } } = req;
    const uploadedFile = await this.uploadFiles.findById(id);
    res.contentType(uploadedFile.contentType);
    res.send(uploadedFile.file.buffer);
  }

  @rescuable
  async _uploadPhoto(req: express.Request, res: express.Response, next: express.NextFunction) {
    const persistFile = await this.uploadFiles.customCreate(
      this.generateUploadFileAttrs(req, { contentType: "image/jpeg" })
    );
    const image = await this.uploadFiles.findById(persistFile.id);
    res.contentType("image/jpeg");
    res.send(image.file.buffer);
  }
}

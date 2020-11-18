import * as express from "express";
import multer = require("multer");

export interface RegisterableController {
  register(app: express.Application, upload?: multer.Instance): void;
}

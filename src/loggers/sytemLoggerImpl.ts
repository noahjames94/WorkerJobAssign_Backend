import { SystemLogger } from "./systemLogger";

import winston = require("winston");
import { injectable } from "inversify";

@injectable()
export class SystemLoggerImpl implements SystemLogger {
  logger: any;
  async info(message: string): Promise<any> {
    this.logger.info({
      level: "info",
      message: message,
      date: new Date()
    });
  }

  async  warn(message: string): Promise<any> {
    this.logger.warn({
      level: "warn",
      message: message,
      date: new Date()
    });
  }

  async  error(message: string): Promise<any> {
    this.logger.error({
      level: "error",
      message: message,
      date: new Date()
    });
  }

  constructor() {
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logger.log" })
      ]
    });
  }
}

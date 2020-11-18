import { Logger } from "winston";

export interface SystemLogger {
  logger: Logger;
  info(message: string): Promise<any>;
  warn(message: string): Promise<any>;
  error(message: string): Promise<any>;
}

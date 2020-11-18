import { Repository } from "typeorm";
import { User, Subcontractor, UploadFile, Notification } from "@entities";

export interface MongoDbContext {
  user: Repository<User>;
  uploadFile: Repository<UploadFile>;
  subcontractor: Repository<Subcontractor>;
  notification: Repository<Notification>;
  [key: string]: any;
}

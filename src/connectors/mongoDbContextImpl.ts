import { createConnection, Connection, Repository } from "typeorm";
import { injectable } from "inversify";
import { MongoDbContext } from "./mongoDbConnext";
import { User, Subcontractor, UploadFile, Notification } from "@entities";
import { connection } from "../app";

@injectable()
export class MongoDbContextImpl implements MongoDbContext {
  connection: Connection;
  user: Repository<User>;
  subcontractor: Repository<Subcontractor>;
  uploadFile: Repository<UploadFile>;
  notification: Repository<Notification>;

  constructor() {
    console.log("initConnect");
    this.initConnect();
  }

  async initConnect(): Promise<void> {
    try {
      console.log("this.user");
      this.connection = connection;
      console.log(connection);
      this.user = this.connection.getRepository(User);
      console.log("this.user");
      this.subcontractor = this.connection.getRepository(Subcontractor);
      this.uploadFile = this.connection.getRepository(UploadFile);
      this.notification = this.connection.getRepository(Notification);
    } catch (error) {
      console.error("Cannot connect to database", error);
    }
  }
}

import {
  BeforeInsert,
  Column,
  Entity,
  ObjectID,
  ObjectIdColumn
} from "typeorm";
import { ApplicationEntity } from "./applicationEntity";
import {
  IsDateString,
  IsNotEmpty, IsNumber,
  IsOptional, ValidateNested
} from "class-validator";
import { Transform } from "class-transformer";
import { toHexString } from "../commons";
import { MongoHelper } from "../main";
import { TracePoint } from "./location";
const {ObjectId} = require("mongodb").ObjectId;
import { ObjectID as OId } from "mongodb";

@Entity()
export class WorkerTrace extends ApplicationEntity {
  static tableName = "workerTrace";

  @Column()
  @IsNotEmpty()
  @Transform(toHexString, { toPlainOnly: true })
  workerId: OId;

  @Column()
  @IsOptional()
  @Transform(toHexString, { toPlainOnly: true })
  jobId: OId;

  @Column()
  @IsNotEmpty()
  @ValidateNested()
  location: TracePoint;

  @Column()
  @IsNotEmpty()
  @IsDateString()
  createdAt: Date;

  @BeforeInsert()
  async beforeInsert() {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }

     const query = {
       workers: {
         $elemMatch: {
           workerId: this.workerId.toString(),
           startDate: {
             $lt: new Date().toISOString()
           },
           endTime: {
             $gte: new Date().toISOString()
           }
         }
       },
     };
     await MongoHelper.connect();
     const collection = MongoHelper.getCollection("job");
     const currentJob = await collection.findOne(query);
     if (currentJob) {
       this.jobId = ObjectId(currentJob._id);
     }
   }

  static get permitedAttributes() {
    return [
      "workerId",
      "createdAt",
      "location"
    ];
  }
}
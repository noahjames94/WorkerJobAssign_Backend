import { User } from "@entities";
import { Exclude, Expose, Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import {
  AfterLoad,
  BeforeInsert,
  Column,
  Entity,
  ObjectID,
  ObjectIdColumn,
} from "typeorm";
import { ApplicationEntity } from "./applicationEntity";
import { toHexString } from "../commons";
const { ObjectId } = require("mongodb").ObjectId;

@Entity()
export class Subcontractor extends ApplicationEntity {
  static tableName = "subcontractor";

  @Column()
  @IsNotEmpty()
  @Exclude()
  subcontractorId: string;

  @Column()
  workerIds: any[];

  @Expose({ name: "subcontractor" })
  contractor: User;

  @Expose({ name: "workers" })
  workers: User[];

  @Column()
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @AfterLoad()
  async loadRelateData() {
    const userRepo = this.getRepository(User);
    this.contractor = await userRepo.findOne(this.subcontractorId);
  }

  @BeforeInsert()
  async setDefaultValues() {
    this.workerIds = [] as any[];
  }
  async loadWorkers() {
    const userRepo = this.getRepository(User);
    if (this.workerIds && this.workerIds.length > 0) {
      const workers = [];
      for (let i = 0; i < this.workerIds.length; i++) {
        const id = this.workerIds[i].id;
        const worker = await userRepo.findOne(id);
        workers.push(worker);
      }

      // const workers = await userRepo.findByIds(this.workerIds.map((item) => {
      //   console.log('item: ', item)
      //   return item.id;
      //   // (id) => ObjectId(id))
      // });
      return workers as Array<User>;
    } else {
      return new Array<User>();
    }
  }
  @Expose({ name: "name" })
  @Exclude()
  get name() {
    return this.contractor.name;
  }
}

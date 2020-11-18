import { Entity, Column, ObjectIdColumn, ObjectID } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { ApplicationEntity } from "./applicationEntity";
import { Expose, Exclude, Transform } from "class-transformer";
import { toHexString } from "../commons";

@Entity()
export class UploadFile extends ApplicationEntity {
  static tableName = "uploadFile";

  @Column({ nullable: false })
  @IsNotEmpty()
  contentType: string;

  @Column({ nullable: false })
  @IsNotEmpty()
  @Exclude()
  file: Buffer;

  @Expose()
  path() {
    return `file/${this.id}`;
  }
}

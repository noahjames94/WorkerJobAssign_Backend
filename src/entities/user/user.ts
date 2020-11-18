import { Entity, ObjectID, ObjectIdColumn, Column, BeforeInsert } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { IsEmail, Validate, IsNotEmpty } from "class-validator";

import { ConedEmailValidator } from "@validators";
import { Buildable } from "@commons/decorators";
import { ApplicationEntity } from "../applicationEntity";
import { Transform } from "class-transformer";
import { toHexString } from "../../commons";
import { ACTIVE } from "@constants";

@Entity()
@Buildable
export class User extends ApplicationEntity {
  static tableName = "user";

  @Column({ nullable: false })
  @IsNotEmpty()
  firstName: string;

  @Column({ nullable: false })
  @IsNotEmpty()
  lastName: string;

  @Column({ unique: true, nullable: false })
  @IsNotEmpty()
  @IsEmail()
  @Validate(ConedEmailValidator)
  email: string;

  @Column({ default: ACTIVE.inactive })
  isActive: number;

  @Column({ default: "" })
  activateToken: string;

  @IsNotEmpty()
  @Column({ select: false })
  password: string;

  @Column()
  departments: string[];

  @Column()
  roles: string;

  @Column()
  isApproved: boolean;

  @BeforeInsert()
  setDefaultValues() {
    this.password = bcrypt.hashSync(this.password, 10);
    this.activateToken = crypto.randomBytes(16).toString("hex");
    this.isApproved = false;
    this.isActive = ACTIVE.inactive;
  }

}

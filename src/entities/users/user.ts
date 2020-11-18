import { Entity, ObjectID, ObjectIdColumn, Column, BeforeInsert } from "typeorm";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { IsEmail, Validate } from "class-validator";

import { Department } from "@entities";
import { Role } from "@entities";
import { ConedEmailValidator } from "@validators";

@Entity()
export class User {

  @ObjectIdColumn()
  id: ObjectID;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ unique: true })
  @IsEmail()
  @Validate(ConedEmailValidator)
  email: string;

  @Column({ default: false })
  isActive: number;

  @Column({ default: "" })
  activateToken: string;

  @Column()
  password: string;

  @Column()
  departments: Department[];

  @Column()
  roles: Role[];

  @BeforeInsert()
  hashPassword() {
    this.password = bcrypt.hashSync(this.password, 10);
    this.activateToken = crypto.randomBytes(16).toString("hex");
  }

}

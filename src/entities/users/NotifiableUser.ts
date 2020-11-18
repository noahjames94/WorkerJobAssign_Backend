import { ObjectID, Column } from "typeorm";
import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

export class NotifiableUser {
  @Column()
  @IsNotEmpty()
  userId: string | ObjectID;

  @Column()
  @IsNotEmpty()
  email: string;

  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  isRead: boolean;
}

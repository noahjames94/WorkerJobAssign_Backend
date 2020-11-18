import { JobStatus } from "@constants";
import { IsDateString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { Column } from "typeorm";

export class LogStatus {
  @Column()
  @IsNumber()
  @IsNotEmpty()
  status: JobStatus;

  @Column()
  @IsOptional()
  @IsDateString()
  time: Date;
}

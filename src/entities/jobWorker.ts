import { Subcontractor, User, WorkerTrace } from "@entities";
import { Exclude, Expose } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested
 } from "class-validator";
import { BeforeInsert, Column, Entity, ObjectID } from "typeorm";

import { Location } from "./location";
import { JobStatus } from "@constants";
/**
 * NESTED OBJECT
 * This is not an entity
 */

export enum WorkerJobStatus {
  NEW,
  ENROUTE,
  LOCATION,
  SECURED,
  ENDOFSHIFT,
  REVIEW,
  CANNOTSECURE,
  COMPLETE
}

@Entity()
export class JobWorker {

  @Column()
  @IsNotEmpty()
  subcontractorId: string;

  @Column()
  @IsNotEmpty()
  workerId: string;

  @Column()
  @IsNotEmpty()
  startDate: Date;

  @Column()
  @IsNotEmpty()
  endDate: Date;

  @Column()
  @IsNotEmpty()
  @ValidateNested()
  location: Location;

  @Column()
  @IsNotEmpty()
  locationID: number;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  status: WorkerJobStatus;


	@Column({ default: JobStatus.New })
	@IsNumber()
	@IsNotEmpty()
	jobStatus: JobStatus;

  @Column()
  @IsNotEmpty()
  assignerId: string | ObjectID;

  @Column({ default:  new Array<string>()})
  @IsOptional()
  @IsArray()
  images: string[];

  /**
   * apollo
   */
  @Column()
  @IsBoolean()
  @IsOptional()
  hasSeen: boolean;
  /**
   * --apollo
   */

  @Column()
  @IsOptional()
  assignerName?: string;

  @Expose({ name: "worker" })
  worker: User;

  @Expose({ name: "subcontractor" })
  subcontractor: Subcontractor;

  trace?: Array<WorkerTrace>;

  @BeforeInsert()
  async setDefaultValues() {
    if (!this.status) {
      this.status = WorkerJobStatus.NEW;
    }
  }

  @Exclude()
  permitedAttributes = [
      "status",
  ];
}

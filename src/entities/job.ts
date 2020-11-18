import {
  JobWorker,
  Notification,
  Timesheet,
  User,
  WorkerTrace,
} from "@entities";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import {
  AfterLoad,
  BeforeInsert,
  Column,
  Entity,
  FindManyOptions,
  getMongoRepository,
  ObjectID,
  ObjectIdColumn,
} from "typeorm";

import { ApplicationEntity } from "./applicationEntity";
import { Exclude, Expose, Transform } from "class-transformer";
import {
  DEPARTMENTS,
  EROLES,
  JobStatus,
  JobType,
  searchDepartmentsByName,
} from "@constants";
import { Location } from "./location";
import { WorkerJobStatus } from "./jobWorker";
import { ChangesLog } from "./changesLog";
import { Municipality } from "./municipality";
import { DateTime } from "../utils/dateTime/dateTime";
import { LogStatus } from "./job/logStatus";
import EnumHelper from "../utils/enumHelper";
import moment = require("moment");
import { notifiableTypes } from "./notification";
import { toHexString } from "../commons";
import _ from "lodash";
const { ObjectId } = require("mongodb").ObjectId;

@Entity()
// @Unique(["po"])
export class Job extends ApplicationEntity {
  static tableName = "job";

  @Exclude()
  public static confirmationCode = 100000000;

  @Column()
  title?: string;

  @Column()
  // @IsNumber()
  // @IsNotEmpty()
  totalPo?: number;

  @Column()
  confirmNumber?: string;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  jobType: JobType;

  @Column()
  @IsNotEmpty()
  requestTime: Date;

  @Column()
  @IsOptional()
  @IsDateString()
  endTime: Date;

  requestorName?: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  requestor: string;

  supervisorName?: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  supervisor: string;

  departmentName?: string;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  @IsIn(DEPARTMENTS.map((d) => d.id))
  department: number;

  @Column()
  @IsNotEmpty()
  section: string;

  @Column()
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  po: number;

  @Column()
  @IsNumber()
  @IsOptional()
  feeder: number;

  @Column()
  @IsNumber()
  @IsOptional()
  account: number;

  @Column()
  @IsNotEmpty()
  @ValidateNested()
  municipality: Municipality;

  @Column()
  @IsNumber()
  @IsOptional()
  // @IsNotEmpty()
  maxWorkers: number;

  @Column()
  wr: number;

  @Column()
  requisition: number;

  @Column()
  @IsNotEmpty()
  locations: Location[];

  @Column()
  comment: string;

  @Column()
  @IsNotEmpty()
  @ValidateNested()
  workers: JobWorker[];

  @Column()
  @IsNumber()
  @IsNotEmpty()
  jobStatus: JobStatus;

  @Column()
  @IsNotEmpty()
  creatorId: string;

  @Column()
  @IsArray()
  @ValidateNested({ each: true })
  changesLog: ChangesLog[];

  @Column({ default: new Array<LogStatus>() })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  statusLog: Array<LogStatus>;

  timesheets?: Timesheet[];

  @Column()
  @IsBoolean()
  @IsOptional()
  hasSeen: boolean;

  @Column()
  @IsOptional()
  jobImages: string[];

  requestorObj: User;
  supervisorObj: User;
  departmentSupervisors: User[];
  conEdBillingAdmins: User[];
  notificationObj: { type: number };
  workerObjs: User[];

  @BeforeInsert()
  async beforeInsert() {
    if (this.timesheets) {
      delete this.timesheets;
    }
    if (this.departmentSupervisors) delete this.departmentSupervisors;
    if (this.conEdBillingAdmins) delete this.conEdBillingAdmins;
    if (this.requestorObj) delete this.requestorObj;
    if (this.supervisorObj) delete this.supervisorObj;
    if (this.notificationObj) delete this.notificationObj;
    if (this.workerObjs) delete this.workerObjs;
  }

  workerView(worker: JobWorker) {
    const requestDateTime = new DateTime(
      moment(this.requestTime)
        .add(worker.worker.timezone, "hours")
        .toISOString(true)
    );
    const workerEndHr =
      worker.worker.workingHours[worker.worker.workingHours.length - 1];
    const endTime =
      !workerEndHr || this.endTime
        ? new DateTime(
          moment(this.endTime)
            .add(worker.worker.timezone, "hours")
            .toISOString(true)
        )
        : new DateTime(
          moment(this.requestTime)
            .hours(Number(workerEndHr.end.hour))
            .minutes(Number(workerEndHr.end.minute))
            .add(worker.worker.timezone, "hours")
            .toISOString(true)
        );
    const finishTime = new DateTime(
      moment(new Date()).add(worker.worker.timezone, "hours").toISOString(true)
    );
    return {
      id: this.id,
      account: this.account,
      confirmationNumber: this.confirmationNumber,
      totalPo: this.totalPo,
      confirmNumber: this.confirmNumber,
      timeAvaliable: {
        begin: {
          hour: requestDateTime.hours,
          minute: requestDateTime.minutes,
        },
        end: {
          hour: endTime.hours,
          minute: endTime.minutes,
        },
      },
      startDate: `${requestDateTime.date}`,
      startTime: `${requestDateTime.hours}:${requestDateTime.minutes}`,
      finishDate: `${finishTime.date}`,
      finishTime: `${finishTime.hours}:${finishTime.minutes}`,
      jobName: this.title,
      location: worker.location,
      date: worker.startDate,
      jobStatus: this.jobStatus,
      workerStatus: worker.status || 0,
      type: this.jobType,
      requestDate: requestDateTime.Date.toISOString(),
      requestorName: this.requestorName,
      supervisorName: this.supervisorName,
      supervisor: this.supervisor,
      departmentName: this.departmentName,
      section: this.section,
      municipality: this.municipality,
      po: this.po,
      images: worker.images || [],
      jobImages: this.jobImages || [],
      feeder: this.feeder,
      maxWorkers: this.maxWorkers,
      wr: this.wr,
      requisition: this.requisition,
      comment: this.comment,
      creatorId: this.creatorId,
      uid: this.uid,
      workRequest: 1,
      isRead: true,
      hasSeen: !!worker.hasSeen,  //apollo
      scheduledStartDate: worker.startDate,
      scheduledEndDate: worker.endDate || null,
    };
  }

  @AfterLoad()
  async loadRelatedData() {
    this.workers = (await Promise.all(
      this.workers.map(async (worker) => {
        worker.worker = await this.getRepository(User).findOne(
          worker.workerId.toString()
        );
        worker.trace = [] as any;
        // worker.trace = await this.getRepository(WorkerTrace).find({
        // 	$query: {
        // 		workerId: ObjectId(worker.workerId),
        // 		// jobId: ObjectId(this.id.toString()),
        // 		createdAt: {
        // 			$gte: worker.startDate,
        // 			// $lt: this.endTime
        // 		}
        // 	}, $orderby: { createdAt: -1 }
        // } as any);
        return worker;
      })
    )) as JobWorker[];
    this.departmentName =
      DEPARTMENTS[
        DEPARTMENTS.findIndex((dep) => dep.id === this.department)
      ].name;
    const timesheetRepository = this.getRepository(Timesheet);
    if (!this.withoutRelations.has("timesheets")) {
      this.timesheets = await timesheetRepository.find({
        jobId: ObjectId(this.id),
      });
    }
    const supervisor = await this.getRepository(User).findOne(this.supervisor);
    if (supervisor) {
      this.supervisorName = supervisor.name;
      this.supervisorObj = supervisor;
    }
    const requestor = await this.getRepository(User).findOne(this.requestor);
    if (requestor) {
      this.requestorName = requestor.name;
      this.requestorObj = requestor;
    }

    if (this.department) {
      this.departmentSupervisors = await this.getRepository(User).find({
        where: {
          roles: { $in: [EROLES.department_supervisor] },
          departments: { $in: [this.department] }
        }
      });

      this.conEdBillingAdmins = await this.getRepository(User).find({
        where: {
          roles: { $in: [EROLES.coned_billing_admin] },
          departments: { $in: [this.department] }
        }
      });
    }

    this.workerObjs = this.workers ? this.workers.map((item) => item.worker) : [];

  }

  @Exclude()
  logStatusChanges(newStatus: JobStatus, old?: JobStatus) {
    if (!this.statusLog) {
      this.statusLog = new Array<LogStatus>();
    }
    if (old != newStatus) {
      const index = this.statusLog.findIndex(
        (_log) => _log.status === newStatus
      );
      if (index !== -1) {
        this.statusLog[index].time = new Date();
      } else {
        const logStatus = new LogStatus();
        logStatus.status = newStatus;
        logStatus.time = new Date();
        this.statusLog.push(logStatus);
      }
    }
    return this;
  }

  @Exclude()
  static async buildSearchQuery(params: any, isMobile = false) {
    const query = {} as any;
    if (Array.isArray(params.jobStatus)) {
      const statuses = params.jobStatus.map((status: any) => +status);
      query.workers && query.workers.status && isMobile
        ? (query.workers.status = { $in: statuses })
        : (query.jobStatus = { $in: statuses });
      if (!params.canceled_job && !isMobile) {
        // $not: JobStatus.Cancelled
        query.jobStatus.$not = JobStatus.Cancelled;
      }
    }
    if (Array.isArray(params.jobType)) {
      const types = params.jobType.map((type: any) => +type);
      query.jobType = { $in: types };
    }
    if (params.hasOwnProperty("requestDate")) {
      if (typeof params.requestDate === "string") {
        try {
          params.requestDate = JSON.parse(params.requestDate);
        } catch (error) {
          console.log(error);
        }
        const requestDate = params.requestDate;
        if (!_.isEmpty(requestDate)) {
          query.$or = [
            {
              requestTime: { $gte: requestDate.from },
              endTime: { $lte: requestDate.to },
            },
            {
              requestTime: { $gte: requestDate.from },
              // tslint:disable-next-line:no-null-keyword
              endTime: null,
            },
          ];
        }
      }
    }
    if (params.search) {
      const searchQ = params.search.toString().toLowerCase();
      const supervisors = (
        await getMongoRepository(User).find({
          $or: [
            { firstName: { $regex: new RegExp(searchQ), $options: "si" } },
            { lastName: { $regex: new RegExp(searchQ), $options: "si" } },
          ],
          roles: {
            $in: [
              EROLES.ces_field_supervisor,
              EROLES.coned_field_supervisor,
              EROLES.department_supervisor,
              EROLES.dispatcher_supervisor,
            ],
          },
        } as FindManyOptions)
      ).map((supervisor: User) => {
        return supervisor.id;
      });

      const _queryOr = [
        {
          jobStatus: {
            $in: new EnumHelper(JobStatus).searchByName(searchQ, "values"),
          },
        },
        {
          jobType: {
            $in: new EnumHelper(JobType).searchByName(searchQ, "values"),
          },
        },
        { supervisor: { $in: supervisors } },
        { department: { $in: searchDepartmentsByName(searchQ) } },
        {
          "workers.worker": {
            $elemMatch: {
              $or: [
                { firstName: { $regex: new RegExp(searchQ), $options: "si" } },
                { lastName: { $regex: new RegExp(searchQ), $options: "si" } },
              ],
            },
          },
        },
        {
          locations: {
            $elemMatch: {
              address: { $regex: new RegExp(searchQ), $options: "si" },
            },
          },
        },
        { po: { $regex: new RegExp(searchQ), $options: "si" } },
        { departmentName: { $regex: new RegExp(searchQ), $options: "si" } },
        { supervisorName: { $regex: new RegExp(searchQ), $options: "si" } },
        { confirmNumber: { $regex: new RegExp(searchQ), $options: "si" } },
        { requestTime: { $regex: new RegExp(searchQ), $options: "si" } },
        { title: { $regex: new RegExp(searchQ), $options: "si" } },

        {
          $where: `/${searchQ}/.test(this.timesheets && this.timesheets[0] && this.timesheets[0].confirmationNumber)`,
        },
        { $where: `/${searchQ}/.test(this.po && this.po)` },
      ];

      query.$or = query.$or ? [...query.$or, ..._queryOr] : _queryOr;
    }
    if (params.workerId) {
      query["workers.workerId"] = params.workerId;
    }
    if (params.department) {
      query["department"] = Number(params.department);
    }
    if (params.requestor) {
      query["requestor"] = params.requestor;
    }
    if (
      params.hasOwnProperty("canceled_job") &&
      params.canceled_job === "true"
    ) {
      if (query.jobStatus && Array.isArray(query.jobStatus.$in)) {
        query.jobStatus.$in.push(JobStatus.Cancelled);
      } else {
        query.jobStatus = { $in: [JobStatus.Cancelled] };
      }
    } else if (
      query.jobStatus &&
      Array.isArray(query.jobStatus.$in) &&
      query.jobStatus.$in.includes(JobStatus.Cancelled)
    ) {
      query.jobStatus.$in.splice(
        query.jobStatus.$in.indexOf(JobStatus.Cancelled),
        1
      );
    }
    if (params.hasOwnProperty("unassigned") && params.unassigned === "true") {
      query.workers = { $size: 0 };
    }
    if (
      params.hasOwnProperty("late_workers") &&
      params.late_workers === "true"
    ) {
      // @ToDo: Implement
    }
    if (
      params.hasOwnProperty("schedules_needed") &&
      params.schedules_needed === "true"
    ) {
      // @ToDo: Implement
    }
    return query;
  }

  @Expose()
  get confirmationNumber() {
    return Job.confirmationCode + +this.uid;
  }

  @Exclude()
  setWorkerStatus(workerId: string, date: Date, status: WorkerJobStatus) {
    const idx = this.workers.findIndex(
      (_worker) =>
        _worker.workerId === workerId &&
        _worker.workerId === workerId &&
        date === _worker.startDate
    );

    const jobWorker = this.workers[idx];
    if (jobWorker && jobWorker.status !== status) {
      jobWorker.status = status;
      this.workers[idx] = jobWorker;
      switch (status) {
        case WorkerJobStatus.NEW:
          jobWorker.jobStatus = JobStatus.New;
          break;
        case WorkerJobStatus.ENROUTE:
          this.notificationObj = { type: notifiableTypes.WORKER_EN_ROUTE };
          // jobWorker.jobStatus = JobStatus.InProgress;
          break;
        case WorkerJobStatus.LOCATION:
          this.notificationObj = { type: notifiableTypes.WORKER_ON_LOCATION };
          // jobWorker.jobStatus = JobStatus.InProgress;
          break;
        case WorkerJobStatus.SECURED:
          this.notificationObj = { type: notifiableTypes.WORKER_SECURED_SITE };
          // jobWorker.jobStatus = JobStatus.InProgress;
          break;
        case WorkerJobStatus.CANNOTSECURE:
          // jobWorker.jobStatus = JobStatus.InProgress;
          break;
        case WorkerJobStatus.ENDOFSHIFT:
          jobWorker.jobStatus = JobStatus.Completed;
          break;
        case WorkerJobStatus.REVIEW:
          {
            jobWorker.jobStatus = JobStatus.Review;
          }
          // @ToDo: Implement other types
          const inProgress = this.workers.some(
            (worker) => worker.jobStatus === JobStatus.InProgress
          );
          const isCompleted = this.workers.every(
            (worker) => worker.jobStatus === JobStatus.Completed
          );

          this.jobStatus = isCompleted
            ? JobStatus.Completed
            : inProgress
              ? JobStatus.InProgress
              : JobStatus.New;
      }
    }
    return this;
  }
}

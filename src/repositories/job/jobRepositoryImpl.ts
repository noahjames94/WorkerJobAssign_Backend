import "reflect-metadata";
import { Job, JobWorker, Notification, User } from "@entities";
import { JobStatus } from "@constants";
import { JobRepository, NotificationRepositoryImpl, TimesheetRepositoryImpl } from "@repositories";
import { MetadataObj } from "commons";
import { EntityRepository, DeleteResult, getCustomRepository, FilterQuery } from "typeorm";
import { notifiableTypes } from "../../entities/notification";
import { Request } from "express";
import { ApplicationRepositoryImpl } from "../applicationRepository";
import { ChangesLog } from "../../entities/changesLog";
import { QueryBuilderImpl } from "@utils/queryBuilder";
import { Pagination } from "@paginate";
import app, { mailer, notifyServer } from "../../app";

@EntityRepository(Job)
export class JobRepositoryImpl extends ApplicationRepositoryImpl<Job> implements JobRepository {
  EntityType = Job;
  private _author: User;

  set author(value: User) {
    this._author = value;
  }

  async add(args: MetadataObj, permitKeys: string[]): Promise<Job> {
    const job = await this.customCreate(args, permitKeys);

    NotificationRepositoryImpl.createNotificationForJob(job, notifiableTypes.CREATE_JOB);
    (await notifyServer).sendUpdateJob(job);

    return job;
  }

  async update(entity: Job, args: MetadataObj, permitKeys: Array<string> = []): Promise<Job> {
    const job = await this.customUpdate(entity, args, permitKeys);

    let notificationType: number = notifiableTypes.EDIT_JOB;
    if (entity.notificationObj) {
      notificationType = entity.notificationObj.type;
    }
    NotificationRepositoryImpl.createNotificationForJob(job, notificationType);

    return job;
  }

  async customCreate(args: MetadataObj, permitKeys: Array<string> = []): Promise<Job> {
    let entity = await super.buidEntity();
    const _old = JSON.parse(JSON.stringify(entity));
    entity.assignAttributes(args, permitKeys);
    if (!entity.changesLog || !Array.isArray(entity.changesLog)) {
      entity.changesLog = new Array<ChangesLog>();
    }
    await entity.validate();

    entity = entity.logStatusChanges(entity.jobStatus);
    entity.changesLog.push(ChangesLog.createLog(permitKeys, _old, entity, this._author));

    if (Array.isArray(entity.workers)) {
      entity.workers.map((worker) => {
        worker.hasSeen = false;
      });
    }

    return await entity.save();
  }

  async customUpdate(entity: Job, args: MetadataObj, permitKeys: Array<string> = []): Promise<Job> {
    const _old = JSON.parse(JSON.stringify(entity));
    entity.assignAttributes(args, permitKeys);
    
    if (!entity.changesLog || !Array.isArray(entity.changesLog)) {
      entity.changesLog = new Array<ChangesLog>();
    }
    
    await entity.validate();
    const updated = await entity.save();
    
    updated.changesLog.push(ChangesLog.createLog(permitKeys, _old, updated, this._author));
    updated.logStatusChanges(updated.jobStatus, _old.jobStatus);
    if (updated.jobStatus == JobStatus.Cancelled) {
      if (updated.timesheets && updated.timesheets.length > 0) {
        updated.timesheets.forEach(async (element) => {
          element.finishDate = new Date().toISOString() as any;
          element.totalHours = args["trackingHours"];
        });
      }
    }
    
    let updateUser:JobWorker[] =[];
    if(Array.isArray(updated.workers)){
      updated.workers.map(async (worker)=>{
        let searchIndex = -1
        if(Array.isArray(_old.workers))
        {
          searchIndex = _old.workers.findIndex((oldworker :JobWorker)=>{
            if(worker.locationID == oldworker.locationID &&
               worker.startDate == oldworker.startDate &&
               worker.endDate == oldworker.endDate )
               return true
          })
          if(searchIndex == -1)
          {
            worker.hasSeen = false

          }else{

          }
        }else
        {
          worker.hasSeen = false
        }
        if(!worker.hasSeen){
          updateUser.push(worker)

        }
        
      })
    }
    let receiveUser:JobWorker[] = [];
    receiveUser = [...updated.workers]
    console.log("receiveUSer: ",receiveUser);

    if(Array.isArray(_old.workers)){
      _old.workers.map((worker:JobWorker)=>{
        if(receiveUser.findIndex((reu)=>reu.workerId == worker.workerId)==-1){
          receiveUser.push(worker)
        }
      })
    }
    await updated.save();
    console.log("receiveUSer: ",receiveUser);
    (await notifyServer).sendUpdateJobWithUser(updated,receiveUser);
    //(await notifyServer).sendUpdateJob(updated);
    

    if (updated.jobStatus == JobStatus.Cancelled) {
      const notification = new Notification({
        userId: updated.creatorId,
        notifiableType: notifiableTypes.CANCEL_JOB,
        notifiableId: updated.id,
        notifiableGroup: {
          type: updated.jobType,
          po: updated.po
        },
        createAt: Date()
      });
      getCustomRepository(NotificationRepositoryImpl).customCreate({ ...notification });

      const timesheets = await getCustomRepository(TimesheetRepositoryImpl).findAllNoPaginate({ jobId: updated.id });
      if (timesheets && timesheets.length > 0) {
        timesheets.forEach(async (element) => {
          element.finishDate = new Date().toISOString() as any;
          element.totalHours = args["trackingHours"];
          await element.save();
        });
      }
    }
    else {
      if (args["workers"] && (_old.workers == null || _old.workers.length === 0)) {
        NotificationRepositoryImpl.createNotificationForJob(
          updated,
          notifiableTypes.ASSIGN_JOB
        );
      }
    }
    
    return updated;
  }

  async delete(id: string): Promise<DeleteResult> {
    return await this.repository.delete(id);
  }


  async findAllWithTextSearch(request: Request, appQuery: any = {}): Promise<Pagination<Job>> {
    const queryBuilder = new QueryBuilderImpl<Job>(request, appQuery);
    const query = queryBuilder.build();
    const results = await this.repository.find(query);

    let total = 0;
    const queryRunner = this.repository.queryRunner as any;
    if (queryRunner) {
      total = await queryRunner.getCollection("job").count((query as any).where as FilterQuery<any>);
    }

    return new Pagination<Job>({
      results,
      total,
      page: queryBuilder.page,
      limit: queryBuilder.limit
    });
  }

}

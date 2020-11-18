import { EntityRepository, getCustomRepository } from "typeorm";
import { NotificationRepository } from "./notificationRepository";
import { Job, Notification, User } from "@entities";
import { ApplicationRepositoryImpl } from "@repositories/applicationRepository";
import { MetadataObj } from "../../commons";
import { Request } from "express";
import { Pagination } from "../../paginate";
import { UserRepositoryImpl } from "../users";
import { ActionNotification, notifiableTypes, NOTIFICATION_MAP } from "../../entities/notification";
import { NotifiableUser } from "../../entities/users/NotifiableUser";
import { ACTIVE, APPROVE, EROLES } from "@constants";
import { DateTime } from "../../utils/dateTime/dateTime";

@EntityRepository(Notification)
export class NotificationRepositoryImpl extends ApplicationRepositoryImpl<Notification> implements NotificationRepository {
  EntityType = Notification;

  async customCreate(args: MetadataObj, permitKeys: Array<string> = []): Promise<Notification> {
    const notification = await super.customCreate(args, permitKeys);
    await notification.loadRelateData();
    notification.send();
    return notification;
  }

  async customUpdate(entity: Notification, args: MetadataObj, permitKeys: Array<string> = []): Promise<Notification> {
    const notification = await super.customUpdate(entity, args, permitKeys);
    notification.send();
    return notification;
  }

  async findAll(request: Request, appQuery: any = {}): Promise<Pagination<Notification>> {
    return super.findAll(request, appQuery);
  }

  static async createNotificationForJob(job: Job, notifiableType: notifiableTypes, data?: any): Promise<Notification[]> {
    const config: { recipients: string[], message: string } = ActionNotification[notifiableType];
    if (!config || !config.recipients.length) return undefined;

    await job.loadRelatedData();
    const jobObj = JSON.parse(JSON.stringify(job));
    const recipientNotificationObj: { [id: string]: User } = {};
    config.recipients.forEach((userTitle) => {
      if (
          jobObj[userTitle] && jobObj[userTitle].id &&
          (!(jobObj[userTitle].id.toString() in recipientNotificationObj))
          // && NOTIFICATION_MAP[notifiableType].every((item) => jobObj[userTitle].notification && jobObj[userTitle].notification.includes(item))
      ) {
        recipientNotificationObj[jobObj[userTitle].id.toString()] = jobObj[userTitle];
      }
    });

    const adminUser = await getCustomRepository(UserRepositoryImpl).findAllNoPaginate({
      roles: { $in: [EROLES.superadmin, EROLES.dispatcher, EROLES.dispatcher_supervisor] },
      isActive: ACTIVE.active, isApproved: APPROVE.approved
    });

    adminUser.forEach((user) => {
      if (
          !(user.id.toString() in recipientNotificationObj)
          // && NOTIFICATION_MAP[notifiableType].every((item) => user.notification && user.notification.includes(item))
      ) {
        recipientNotificationObj[user.id.toString()] = user;
      }
    });

    const fns: any[] = [];
    for (const id in recipientNotificationObj) {
      if (recipientNotificationObj[id].isActive && recipientNotificationObj[id].isApproved) {
        let message: string;
        const notifications = NOTIFICATION_MAP[notifiableType]; // .filter((item) => (recipientNotificationObj[id].notification.includes(item));
        switch (notifiableType) {
          case notifiableTypes.CREATE_JOB:
            message = `Job #${job.confirmationNumber} ${job.locations && job.locations.length ? `for ${job.locations[0].address}` : ""} has been submitted!`;
            break;
          case notifiableTypes.EDIT_JOB:
            message = `Job #${job.confirmationNumber} has been modified`;
            break;
          case notifiableTypes.WORKER_UPLOAD_AN_IMAGE:
            message = `Worker Uploaded an Image. Job po #${job.po}`;
            break;
          case notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED:
            message = `PO Number has been added to Job #${job.confirmationNumber}`;
            break;
          case notifiableTypes.WORKER_EN_ROUTE:
            message = `Worker EnRoute. Job po #${job.po}`;
            break;
          case notifiableTypes.WORKER_ON_LOCATION:
            message = `Worker OnLocation. Job po #${job.po}`;
            break;
          case notifiableTypes.WORKER_SECURED_SITE:
            message = `Worker Secured Site. Job po #${job.po}`;
            break;
          case notifiableTypes.ASSIGN_JOB:
            message = `Worker ${job.workers[0].worker.name} has been assigned to Job #${job.confirmationNumber} for ${job.workers[0].startDate}`;
            break;
          case notifiableTypes.JOB_REROUTE_CURRENT:
            message = `Worker ${data.worker} has been re-routed from ${data?.old.address} to ${data.new.address} for Job #${job.confirmationNumber}.`;
            break;
          case notifiableTypes.JOB_REROUTE_NEW_JOB:
            message = `Worker ${data.worker} has been re-routed from Job #${data?.job} at ${data?.old.address} to Job #${job.confirmationNumber} at ${data.new.address}.`;
            break;
        }

        const notification = new Notification({
          userId: id,
          notifiableType: notifiableType,
          message,
          email: recipientNotificationObj[id].email,
          notifiableId: job.id,
          notifiableGroup: {
            type: job.jobType,
            po: job.po
          },
          notifications,
          createAt: new DateTime(new Date()).dateEST
        });
        fns.push(getCustomRepository(NotificationRepositoryImpl).customCreate({ ...notification }));
      }
    }

    return Promise.all(fns);
  }
}

import { Entity, Column, CreateDateColumn, AfterLoad, ObjectID, ObjectIdColumn } from "typeorm";
import { Exclude, Expose, Transform } from "class-transformer";

import { Buildable } from "@commons/decorators";
import { ApplicationEntity } from "./applicationEntity";
import { User, Invoice, Job, JobWorker } from "@entities";
import { mailer, notifyServer } from "../app";
import NotificationsServer from "../services/notificationsServer";
import FcmService, { FcmMessage } from "../services/fcmService";
import { NotifiableUser } from "./users/NotifiableUser";
import { IsArray, IsOptional } from "class-validator";
import { toHexString } from "../commons";
import { EROLES } from "@constants";

export enum notifiableTypes {
  CREATE_JOB = 1,
  CANCEL_JOB = 2,
  CREATE_INVOICE = 3,
  APPOINTED = 4,
  AWAITING_APROVAL = 5,
  EDIT_JOB = 6,
  ASSIGN_JOB = 7,
  WORKER_EN_ROUTE = 8,
  WORKER_ON_LOCATION = 9,
  WORKER_SECURED_SITE = 10,
  WORKER_UPLOAD_AN_IMAGE = 11,
  WORKER_ENDED_SHIFT = 12,
  PO_NUMBER_HAS_BEEN_ADDED = 13,
  REMINDER_EMAILS = 14,
  JOB_REROUTE_CURRENT = 15,
  JOB_REROUTE_NEW_JOB = 16,
  WORKER_CANNOT_SECURED_SITE = 17,
  WORKER_NOT_EN_ROUTE_YET = 18,
}

export enum ENOTIFICATIONS {
  job_created_email = 0,
  job_created_webpush = 1,
  job_first_assigned_worker_email = 2,
  job_first_assigned_worker_webpush = 3,
  job_PO_email = 4,
  job_PO_webpush = 5,
  job_has_been_modified_email = 6,
  job_has_been_modified_webpush = 7,
  new_job_reroute_email = 8,
  new_job_reroute_webpush = 9,
  current_job_reroute_email = 10,
  current_job_reroute_webpush = 11,
  worker_en_router_email = 12,
  worker_en_router_webpush = 13,
  worker_on_location_email = 14,
  worker_on_location_webpush = 15,
  worker_secured_site_email = 16,
  worker_secured_site_webpush = 17,
  worker_cannot_secured_site_email = 18,
  worker_cannot_secured_site_webpush = 19,
  worker_uploaded_image_email = 20,
  worker_uploaded_image_webpush = 21,
  worker_ended_shift_email = 22,
  worker_ended_shift_webpush = 23,
  worker_not_yet_enroute_email = 24,
  worker_not_yet_enroute_webpush = 25,
  invoice_available_email = 26,
  invoice_available_webpush = 27,
  invoice_number_reminder_emails_email = 28,
  invoice_number_reminder_emails_webpush = 29,
}

export const NOTIFICATION_MAP = {
  [notifiableTypes.CREATE_JOB]: [ENOTIFICATIONS.job_created_email, ENOTIFICATIONS.job_created_webpush],
  [notifiableTypes.CANCEL_JOB]: [ENOTIFICATIONS.job_has_been_modified_email, ENOTIFICATIONS.job_has_been_modified_webpush],
  [notifiableTypes.EDIT_JOB]: [ENOTIFICATIONS.job_has_been_modified_email, ENOTIFICATIONS.job_has_been_modified_webpush],
  [notifiableTypes.AWAITING_APROVAL]: [ENOTIFICATIONS.job_has_been_modified_email, ENOTIFICATIONS.job_has_been_modified_webpush],
  [notifiableTypes.ASSIGN_JOB]: [ENOTIFICATIONS.job_first_assigned_worker_email, ENOTIFICATIONS.job_first_assigned_worker_webpush],
  [notifiableTypes.CREATE_INVOICE]: [ENOTIFICATIONS.invoice_available_email, ENOTIFICATIONS.invoice_available_webpush],
  [notifiableTypes.APPOINTED]: [ENOTIFICATIONS.job_first_assigned_worker_email, ENOTIFICATIONS.job_first_assigned_worker_webpush],
  [notifiableTypes.WORKER_EN_ROUTE]: [ENOTIFICATIONS.worker_en_router_email, ENOTIFICATIONS.worker_en_router_webpush],
  [notifiableTypes.WORKER_ON_LOCATION]: [ENOTIFICATIONS.worker_on_location_email, ENOTIFICATIONS.worker_on_location_webpush],
  [notifiableTypes.WORKER_SECURED_SITE]: [ENOTIFICATIONS.worker_secured_site_email, ENOTIFICATIONS.worker_secured_site_webpush],
  [notifiableTypes.WORKER_UPLOAD_AN_IMAGE]: [ENOTIFICATIONS.worker_uploaded_image_email, ENOTIFICATIONS.worker_uploaded_image_webpush],
  [notifiableTypes.WORKER_ENDED_SHIFT]: [ENOTIFICATIONS.worker_ended_shift_email, ENOTIFICATIONS.worker_ended_shift_webpush],
  [notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED]: [ENOTIFICATIONS.job_PO_email, ENOTIFICATIONS.job_PO_webpush],
  [notifiableTypes.REMINDER_EMAILS]: [ENOTIFICATIONS.invoice_number_reminder_emails_email, ENOTIFICATIONS.invoice_number_reminder_emails_webpush],
  [notifiableTypes.JOB_REROUTE_CURRENT]: [ENOTIFICATIONS.current_job_reroute_email, ENOTIFICATIONS.current_job_reroute_webpush],
  [notifiableTypes.JOB_REROUTE_NEW_JOB]: [ENOTIFICATIONS.new_job_reroute_email, ENOTIFICATIONS.new_job_reroute_webpush],
  [notifiableTypes.WORKER_CANNOT_SECURED_SITE]: [ENOTIFICATIONS.worker_cannot_secured_site_email, ENOTIFICATIONS.worker_cannot_secured_site_webpush],
  [notifiableTypes.WORKER_NOT_EN_ROUTE_YET]: [ENOTIFICATIONS.worker_not_yet_enroute_email, ENOTIFICATIONS.worker_not_yet_enroute_webpush],
}

export const NOTIFICATION_ROLE_MAP: { [s: number]: notifiableTypes[] } = {
  [EROLES.requestor]: [
    notifiableTypes.CREATE_JOB,
    notifiableTypes.EDIT_JOB,
    notifiableTypes.CANCEL_JOB,
    notifiableTypes.CREATE_INVOICE,
    notifiableTypes.REMINDER_EMAILS,
    notifiableTypes.JOB_REROUTE_CURRENT,
    notifiableTypes.JOB_REROUTE_NEW_JOB,
    notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED,
    notifiableTypes.WORKER_ENDED_SHIFT,
    notifiableTypes.WORKER_EN_ROUTE,
    notifiableTypes.WORKER_ON_LOCATION,
    notifiableTypes.WORKER_SECURED_SITE,
    notifiableTypes.WORKER_CANNOT_SECURED_SITE,
    notifiableTypes.WORKER_UPLOAD_AN_IMAGE,
    notifiableTypes.ASSIGN_JOB],
  [EROLES.department_supervisor]: [
    notifiableTypes.CREATE_JOB,
    notifiableTypes.EDIT_JOB,
    notifiableTypes.CANCEL_JOB,
    notifiableTypes.CREATE_INVOICE,
    notifiableTypes.REMINDER_EMAILS,
    notifiableTypes.JOB_REROUTE_CURRENT,
    notifiableTypes.JOB_REROUTE_NEW_JOB,
    notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED,
    notifiableTypes.WORKER_ENDED_SHIFT,
    notifiableTypes.WORKER_EN_ROUTE,
    notifiableTypes.WORKER_ON_LOCATION,
    notifiableTypes.WORKER_SECURED_SITE,
    notifiableTypes.WORKER_CANNOT_SECURED_SITE,
    notifiableTypes.WORKER_UPLOAD_AN_IMAGE,
    notifiableTypes.ASSIGN_JOB],
  [EROLES.coned_field_supervisor]: [
    notifiableTypes.CREATE_JOB,
    notifiableTypes.EDIT_JOB,
    notifiableTypes.CANCEL_JOB,
    notifiableTypes.CREATE_INVOICE,
    notifiableTypes.REMINDER_EMAILS,
    notifiableTypes.JOB_REROUTE_CURRENT,
    notifiableTypes.JOB_REROUTE_NEW_JOB,
    notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED,
    notifiableTypes.WORKER_ENDED_SHIFT,
    notifiableTypes.WORKER_EN_ROUTE,
    notifiableTypes.WORKER_ON_LOCATION,
    notifiableTypes.WORKER_SECURED_SITE,
    notifiableTypes.WORKER_CANNOT_SECURED_SITE,
    notifiableTypes.WORKER_UPLOAD_AN_IMAGE,
    notifiableTypes.ASSIGN_JOB],
  [EROLES.coned_billing_admin]: [
    notifiableTypes.CREATE_INVOICE,
    notifiableTypes.REMINDER_EMAILS,
  ],
  [EROLES.billing]: [
    notifiableTypes.CREATE_INVOICE,
    notifiableTypes.REMINDER_EMAILS,
    notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED
  ],
  [EROLES.dispatcher]: [
    notifiableTypes.CREATE_JOB,
    notifiableTypes.EDIT_JOB,
    notifiableTypes.CANCEL_JOB,
    notifiableTypes.CREATE_INVOICE,
    notifiableTypes.REMINDER_EMAILS,
    notifiableTypes.JOB_REROUTE_CURRENT,
    notifiableTypes.JOB_REROUTE_NEW_JOB,
    notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED,
    notifiableTypes.WORKER_ENDED_SHIFT,
    notifiableTypes.WORKER_EN_ROUTE,
    notifiableTypes.WORKER_ON_LOCATION,
    notifiableTypes.WORKER_SECURED_SITE,
    notifiableTypes.WORKER_CANNOT_SECURED_SITE,
    notifiableTypes.WORKER_UPLOAD_AN_IMAGE,
    notifiableTypes.WORKER_NOT_EN_ROUTE_YET,
    notifiableTypes.ASSIGN_JOB],
  [EROLES.dispatcher_supervisor]: [
    notifiableTypes.CREATE_JOB,
    notifiableTypes.EDIT_JOB,
    notifiableTypes.CANCEL_JOB,
    notifiableTypes.CREATE_INVOICE,
    notifiableTypes.REMINDER_EMAILS,
    notifiableTypes.JOB_REROUTE_CURRENT,
    notifiableTypes.JOB_REROUTE_NEW_JOB,
    notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED,
    notifiableTypes.WORKER_ENDED_SHIFT,
    notifiableTypes.WORKER_EN_ROUTE,
    notifiableTypes.WORKER_ON_LOCATION,
    notifiableTypes.WORKER_SECURED_SITE,
    notifiableTypes.WORKER_CANNOT_SECURED_SITE,
    notifiableTypes.WORKER_UPLOAD_AN_IMAGE,
    notifiableTypes.WORKER_NOT_EN_ROUTE_YET,
    notifiableTypes.ASSIGN_JOB],
  [EROLES.superadmin]: [
    notifiableTypes.CREATE_JOB,
    notifiableTypes.EDIT_JOB,
    notifiableTypes.CANCEL_JOB,
    notifiableTypes.CREATE_INVOICE,
    notifiableTypes.REMINDER_EMAILS,
    notifiableTypes.JOB_REROUTE_CURRENT,
    notifiableTypes.JOB_REROUTE_NEW_JOB,
    notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED,
    notifiableTypes.WORKER_ENDED_SHIFT,
    notifiableTypes.WORKER_EN_ROUTE,
    notifiableTypes.WORKER_ON_LOCATION,
    notifiableTypes.WORKER_SECURED_SITE,
    notifiableTypes.WORKER_CANNOT_SECURED_SITE,
    notifiableTypes.WORKER_UPLOAD_AN_IMAGE,
    notifiableTypes.WORKER_NOT_EN_ROUTE_YET,
    notifiableTypes.ASSIGN_JOB],
}

export const ActionNotification: { [type: number]: { recipients: string[], message: string } } = {
  [notifiableTypes.CREATE_JOB]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors"],
    message: "Job Created"
  },
  [notifiableTypes.ASSIGN_JOB]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors"],
    message: "Job First Assigned to Worker"
  },
  [notifiableTypes.WORKER_EN_ROUTE]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors"],
    message: "Worker EnRoute"
  },
  [notifiableTypes.WORKER_ON_LOCATION]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors"],
    message: "Worker OnLocation"
  },
  [notifiableTypes.WORKER_SECURED_SITE]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors"],
    message: "Worker Secured Site"
  },
  [notifiableTypes.WORKER_UPLOAD_AN_IMAGE]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors"],
    message: "Worker Uploaded an Image"
  },
  [notifiableTypes.WORKER_ENDED_SHIFT]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors"],
    message: "Worker Ended Shift"
  },
  [notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors", "conEdBillingAdmins"],
    message: "PO Number has been added"
  },
  [notifiableTypes.EDIT_JOB]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors"],
    message: "Job has been modified"
  },
  [notifiableTypes.CREATE_INVOICE]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisors", "conEdBillingAdmins"],
    message: "Invoice is available"
  },
  [notifiableTypes.REMINDER_EMAILS]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisor"],
    message: "Invoice/PO Number Reminder Emails for outstanding invoices w/ missing PO Numbers"
  },
  [notifiableTypes.JOB_REROUTE_CURRENT]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisor", "workerObjs"],
    message: "Worker has been rerouted"
  },
  [notifiableTypes.JOB_REROUTE_NEW_JOB]: {
    recipients: ["requestorObj", "supervisorObj", "departmentSupervisor", "workerObjs"],
    message: "Worker has been rerouted"
  },
};

@Entity()
@Buildable
export class Notification extends ApplicationEntity {
  static tableName = "notification";

  @Column({ nullable: false })
  @Exclude()
  userId: string;

  @Expose({ name: "user" })
  user: User;

  @Column()
  notifiableType: notifiableTypes;

  @Column()
  @IsOptional()
  message: string;

  @Column()
  @Exclude()
  notifiableId: string;

  @Expose({ name: "notifiableRecord" })
  notifiableRecord: User | Invoice | Job;

  @Column({ default: new Array<NotifiableUser>() })
  @Exclude()
  @IsOptional()
  @IsArray()
  notifiable: Array<NotifiableUser>;

  @Column()
  notifiableGroup: { type: string, po: string };

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  notifications: ENOTIFICATIONS[];
  email: string;

  @AfterLoad()
  async loadRelateData() {
    this.user = <User>await this.getRepository(User).findOne(this.userId);
    switch (this.notifiableType) {
      case notifiableTypes.CREATE_JOB:
      case notifiableTypes.CANCEL_JOB:
      case notifiableTypes.ASSIGN_JOB:
      case notifiableTypes.WORKER_EN_ROUTE:
      case notifiableTypes.WORKER_ON_LOCATION:
      case notifiableTypes.WORKER_SECURED_SITE:
      case notifiableTypes.WORKER_UPLOAD_AN_IMAGE:
      case notifiableTypes.WORKER_ENDED_SHIFT:
      case notifiableTypes.EDIT_JOB:
      case notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED:
        this.notifiableRecord = <Job>await this.getRepository(Job).findOne(this.notifiableId.toString());
        break;
      case notifiableTypes.CREATE_INVOICE:
        this.notifiableRecord = <Invoice>await this.getRepository(Invoice).findOne(this.notifiableId);
        break;
      case notifiableTypes.APPOINTED:
      case notifiableTypes.AWAITING_APROVAL:
        this.notifiableRecord = <User>await this.getRepository(User).findOne(this.notifiableId);
        break;
      default:
        break;
    }
  }

  @Exclude()
  public async send() {
    if (!this.notifiable) {
      this.notifiable = new Array<NotifiableUser>();
    }
    const notificationServer = await notifyServer;
    switch (this.notifiableType) {
      case notifiableTypes.CREATE_JOB:
      case notifiableTypes.EDIT_JOB:
      case notifiableTypes.CANCEL_JOB:
      case notifiableTypes.CREATE_INVOICE:
      case notifiableTypes.APPOINTED:
      case notifiableTypes.AWAITING_APROVAL:
      case notifiableTypes.ASSIGN_JOB:
      case notifiableTypes.WORKER_EN_ROUTE:
      case notifiableTypes.WORKER_ON_LOCATION:
      case notifiableTypes.WORKER_SECURED_SITE:
      case notifiableTypes.WORKER_UPLOAD_AN_IMAGE:
      case notifiableTypes.WORKER_ENDED_SHIFT:
      case notifiableTypes.PO_NUMBER_HAS_BEEN_ADDED:
      case notifiableTypes.JOB_REROUTE_CURRENT:
      case notifiableTypes.JOB_REROUTE_NEW_JOB:
        await this.sendJobNotify(notificationServer);
        break;
    }
    this.save();
  }

  @Exclude()
  private async sendJobNotify(notificationServer: NotificationsServer) {
    const job = await this.getRepository(Job).findOne(this.notifiableId.toString());
    if (job.workers) {
      job.workers.forEach((worker: JobWorker) => {
        if (this.notifiable.findIndex(_notifiable =>
            _notifiable.userId === worker.workerId.toString()) === -1) {
          const notifiable = new NotifiableUser();
          notifiable.userId = worker.workerId.toString();
          notifiable.email = worker.worker.email;
          notifiable.isRead = false;
          this.notifiable.push(notifiable);
          if (!worker.worker.fcmToken) {
            return;
          }
          try {
            const fcm = new FcmService();
            const fcmMessage = new FcmMessage();
            fcmMessage.to = worker.worker.fcmToken;
            if (this.notifiableType == notifiableTypes.CREATE_JOB) {
              fcmMessage.notification = {
                title: "Job Created",
                body: `New Job po #${this.notifiableGroup.po} created!`
              };
            } else if (this.notifiableType == notifiableTypes.EDIT_JOB) {
              fcmMessage.notification = {
                title: "Job Updated",
                body: `Job po #${this.notifiableGroup.po} was updated!`
              };
            }
            else {
              fcmMessage.notification = {
                title: "Job Canceled",
                body: `Job po #${this.notifiableGroup.po} was canceled!`
              };
            }
            fcm.sendMessage(fcmMessage);
          } catch (error) {
            console.error(error);
          }
        }
      });
    }
    this.notify(notificationServer);
  }

  @Exclude()
  private notify(notificationServer: NotificationsServer) {
    if (this.notifiable.length) {
      this.notifiable.forEach(notifiable => {
        if (this.notifications.includes(NOTIFICATION_MAP[this.notifiableType][1])) {
          console.log(">>>>>>>>>>>>>>>>>: notifiable notify to", notifiable.userId.toString());
          notificationServer.sendNotification(this, notifiable.userId.toString());
        }
        if (this.notifications.includes(NOTIFICATION_MAP[this.notifiableType][0])) {
          console.log(">>>>>>>>>>>>>>>>>: sent notify to", notifiable.email);
          mailer.send(
              notifiable.email,
              { message: this.message },
              "notification"
          );
        }
      });
      notificationServer.sendNotification(this);

    } else {
      console.log(">>>>>>>>>>>>>>>>>: notify to", this.userId.toString());
      notificationServer.sendNotification(this);
      if (this.notifications.includes(NOTIFICATION_MAP[this.notifiableType][0])) {
        console.log(">>>>>>>>>>>>>>>>>: sent notify to", this.email);
        mailer.send(
            this.email,
            { message: this.message },
            "notification"
        );
      }
    }
  }
}

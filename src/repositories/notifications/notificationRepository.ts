import { Notification } from "@entities";
import { ApplicationRepository } from "@repositories/applicationRepository";

export interface NotificationRepository extends ApplicationRepository<Notification> {

}

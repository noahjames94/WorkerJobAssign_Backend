import { ApplicationRepository } from "@repositories/ApplicationRepository";
import { Invoice } from "@entities";

export interface InvoiceRepository extends ApplicationRepository<Invoice> {
}

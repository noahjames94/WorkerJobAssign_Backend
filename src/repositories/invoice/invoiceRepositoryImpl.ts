import { Invoice } from "@entities";
import { ApplicationRepositoryImpl } from "@repositories/applicationRepository";
import { EntityRepository } from "typeorm";

import { InvoiceRepository } from "./invoiceRepository";

@EntityRepository(Invoice)
export class InvoiceRepositoryImpl extends ApplicationRepositoryImpl<Invoice> implements InvoiceRepository {
    EntityType = Invoice;
}

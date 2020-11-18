import "module-alias/register";
import "reflect-metadata";

import {
    IncrementIndex,
    Invoice, Job, Notification, Subcontractor,
    Timesheet, UploadFile, User, WorkerTrace,
} from "../entities";
import { createConnection } from "typeorm";
try {
    const entities = [User, Subcontractor, UploadFile, Invoice, IncrementIndex, Notification, Job, Timesheet, WorkerTrace];
    createConnection({
        type: "mongodb",
        host: `${process.env.DB_HOST}`,
        port: parseInt(`${process.env.DB_PORT || 27017}`, 10),
        database: `${process.env.DB_DATABASE_NAME}`,
        entities,
        synchronize: true
    }).then(() => {
        console.log("ee");
        Invoice.createScheduleInvoices(false)
            .then(() => process.exit()).catch((error) => console.error("Cannot connect to database", error));
    }).catch((error) => console.error("Cannot connect to database", error));
} catch (error) {
    console.error("Cannot connect to database", error);
}

import { INVOICE } from "../constants/invoice";
import { BILLING_CYCLE, Invoice } from "../entities/invoice";

const cron = require("cron-scheduler");

class CronScheduler {
	public static setupTasks = () => {
		cron({ on: "0 0 * * *"}, async () => {
			await Invoice.createScheduleInvoices();
		});

		// cron({ on: "* * * * *"}, () => {
		// 	Invoice.moveToNextCycle();
		// });
		console.log("Cron Schedule Started");
	}
}
export default CronScheduler;
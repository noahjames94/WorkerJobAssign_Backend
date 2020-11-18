import { JobStatus } from "../../constants";
import { getCustomRepository } from "typeorm";
import { JobRepositoryImpl } from "@repositories";

const cron = require("cron-scheduler");

class CronUpdatingJobStatusToInProgress {
  static job: JobRepositoryImpl;
  public static setupTasks = () => {
    cron({ on: "* * * * *"}, async () => {
      try {
        CronUpdatingJobStatusToInProgress.job = getCustomRepository(JobRepositoryImpl);
        const query: any = {
          jobStatus: JobStatus.New,
          requestTime: {
            $lte: new Date().toISOString()
          }
        };
        const jobs = await CronUpdatingJobStatusToInProgress.job.findAllNoPaginate(query);
        console.log(">>>>>>>>>>>>>>>>>: jobs length", jobs.length);
        if (jobs && jobs.length) {
          for (const job of jobs) {
            console.log(">>>>>>>>>>>>>>>>>: update job status to InProgress", job.id);
            job.assignAttributes({jobStatus: JobStatus.InProgress});
            await job.save();
          }
        }
      } catch (e) {
        console.log(">>>>>>>>>>>>>>>>>: err CronJobStatus", e.message);
      }
    });
    console.log("Cron job status Started");
  }
}
export default CronUpdatingJobStatusToInProgress;

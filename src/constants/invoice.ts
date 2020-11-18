import { JobType } from "@constants";

export enum BILLING_CYCLE {
    WEEKLY,
    MONTHLY,
    DAILY
}

export const INVOICE = [
    {
        departments: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        jobTypes: [JobType.Flagging, JobType.Parking, JobType.Signage],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [10],
        jobTypes: [JobType.Flagging],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [10],
        jobTypes: [JobType.Parking],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [10],
        jobTypes: [JobType.Signage],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [11],
        jobTypes: [JobType.Flagging],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [11],
        jobTypes: [JobType.Parking],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [11],
        jobTypes: [JobType.Signage],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [12],
        jobTypes: [JobType.Flagging],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [12],
        jobTypes: [JobType.Parking],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [12],
        jobTypes: [JobType.Signage],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [13],
        jobTypes: [JobType.Flagging],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [13],
        jobTypes: [JobType.Parking],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [13],
        jobTypes: [JobType.Signage],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [14],
        jobTypes: [JobType.Flagging],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [14],
        jobTypes: [JobType.Parking],
        cycle: BILLING_CYCLE.WEEKLY
    },
    {
        departments: [14],
        jobTypes: [JobType.Signage],
        cycle: BILLING_CYCLE.WEEKLY
    }
];
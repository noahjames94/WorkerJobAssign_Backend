export enum JobStatus {
    New,
    InProgress,
    Completed,
    Review,
    Billed,
    Paid,
    Cancelled
}

export enum JobType {
    Flagging,
    Parking,
    Signage
}

export enum flaggingPrices {
    reg = 25,
    ot = 37.50,
    hol = 37.5
}

export enum parkingPrices {
    reg = 20.50,
    ot = 30.75,
    hol = 30.75
}

export enum signagePrices {
    reg = 19.5,
    ot = 19.5,
    hol = 19.5
}
import EnumHelper from "../enumHelper";

export class DateTime {
  private _date: Date;

  // Time
  private _hours: string;
  private _minutes: string;

  // Date
  private _year: string;
  private _day: string;
  private _month: string;

  constructor(date?: string | Date) {
    this._date = new Date(date);
    this.parse();
    return this;
  }

  get hours() {
    return this._hours;
  }

  get minutes() {
    return this._minutes;
  }

  get year() {
    return this._year;
  }

  get day() {
    return this._day;
  }

  get month() {
    return this._month;
  }

  get date() {
    return `${this._month}/${this._day}/${this._year}`;
  }

  get dateEST() {
    return `${this._month}-${this._day}-${this._year} ${this._hours}:${this._minutes}`;
  }

  get time() {
    return `${this._hours}/${this._minutes}`;
  }

  get dateTime() {
    return `${this.date} ${this.time}`;
  }

  get Date() {
    return this._date;
  }

  private parse() {
    this._hours = DateTime.addBeginZero(this._date.getHours());
    this._minutes = DateTime.addBeginZero(this._date.getMinutes());

    this._year = this._date.getFullYear().toString();
    this._month = DateTime.addBeginZero(+this._date.getMonth() + 1);
    this._day = DateTime.addBeginZero(this._date.getDate());
  }

  public static addBeginZero(number: number): string {
    let res = number.toString();
    if (res.length < 2) {
      res = `0${res}`;
    }
    return res;
  }

  public static getTimeDiff(end: any, start: any) {
    let msec = (new Date(end).getTime()) - (new Date(start).getTime());
    const  hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    const mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    const ss = Math.floor(msec / 1000);
    msec -= ss * 1000;

    let res = "";

    if (hh > 0) {
      res += `${hh}H`;
    }

    if (mm > 0) {
      res += ` ${mm}m`;
    }

    if (ss > 0) {
      res += ` ${ss}s`;
    }

    return res;
  }

  public static diff(end: any, start: any, type: string = "H"): number {
    let diff = (new Date(end).getTime()) - (new Date(start).getTime());
    if (diff < 0) {
      diff *= -1;
    }
    switch (type) {
      case "s":
        return diff / 1000;
      case "m":
        return diff / 1000 / 60;
      case "H":
        return diff / 1000 / 60;
      case "d":
        return diff / 1000 / 60;
      default:
        return diff;
    }
  }

  public static getWeekDayInMonth(y: number, m: number, dy: string, number: number = 0) {
    if (m < 1 || m > 12) {
      throw "Month must be from 1 to 12";
    }
    enum days {sun, mon, tue, wed, thu, fri, sat}
    const dates = new EnumHelper(days);
    const dateNames = dates.keys;
    if (!dateNames.includes(dy)) {
      throw "Wrong week day name";
    }
    const dat = new Date(y + "/" + m + "/1");
    let currentmonth = m;
    let firstday = false;
    let cacheDate = new Date(dat.toISOString());
    let i = 0;
    while (currentmonth === m) {
      if (number !== 0 && cacheDate.getTime() != dat.getTime() && dat.getDay() === dates.searchByName(dy, "values")[0]) {
        cacheDate = new Date(dat.toISOString());
        i++;
        if (i >= number) {
          break;
        }
      }
      firstday = dat.getDay() === dates.searchByName(dy, "values")[0] || firstday;
      dat.setDate(dat.getDate() + (firstday ? 7 : 1));
      currentmonth = dat.getMonth() + 1 ;
    }
    dat.setDate(dat.getDate() - 7);
    return dat;
  }

  public static rangeDates(startDate: Date, endDate: Date) {
    const addFn = (current: Date, interval: number) => {
      return (new Date(current.setDate(current.getDate() + interval)));
    };
    const retVal = [];
    let current = startDate;
    while (current <= endDate) {
      retVal.push(new Date(current));
      current = addFn(current, 1);
    }
    return retVal;
  }

  public static hoursDiff(startDate: Date, endDate: Date) {
    const diff = DateTime.diff(endDate, startDate, "m");
    const hours = Math.ceil(diff / 60);
    const c = diff % 60;
    const minutes = Math.round((10 * c) / 6) / 100;
    return (hours + minutes);
  }

  public static calculateOffset = (time: number, _time: number) => {
    const minutes = (time - Math.floor(time)) * 100;
    const _minutes = (_time - Math.floor(_time)) * 100;

    const sumMinutes = minutes + _minutes;

    const additionalHours = Math.floor(sumMinutes / 60);

    const newMinutes = (sumMinutes % 60) / 100;

    const amount = Math.floor(_time) + additionalHours + newMinutes;

    return Math.floor(time) + amount;
  }
}

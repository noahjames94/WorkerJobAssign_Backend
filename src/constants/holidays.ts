import { DateTime } from "../utils/dateTime/dateTime";
import moment = require("moment");

class Holiday {
  date: Date;
  name: string;

  constructor(date: Date, name: string) {
    this.date = date;
    this.name = name;
  }
}

export function getHolidays() {
  let result: Array<Holiday>;
  result = [
      new Holiday(new Date(new Date(new Date().setMonth(0)).setDate(1)), "New Year’s Day"),
      new Holiday(new Date(new Date(new Date().setMonth(0)).setDate(21)), "Birthday of Martin Luther King Jr."),
      new Holiday(new Date(new Date(new Date().setMonth(6)).setDate(4)), "Independence Day"),
      new Holiday(new Date(new Date(new Date().setMonth(10)).setDate(11)), "Veterans Day"),
      new Holiday(new Date(new Date(new Date().setMonth(10)).setDate(28)), "Thanksgiving Day"),
      new Holiday(new Date(new Date(new Date().setMonth(11)).setDate(25)), "Christmas Day"),
  ];
  const y = new Date().getFullYear();
  result.push(new Holiday(DateTime.getWeekDayInMonth(y, 1, "mon", 3), "Washington's Birthday"));
  result.push(new Holiday(DateTime.getWeekDayInMonth(y, 4, "mon"), "Memorial Day"));
  result.push(new Holiday(DateTime.getWeekDayInMonth(y, 8, "mon", 1), "Labor Day"));
  result.push(new Holiday(DateTime.getWeekDayInMonth(y, 9, "mon", 2), "Columbus Day"));

  return result;
}

export function isHoliday(date: Date) {
  const holidays = getHolidays();
  const idx = holidays.findIndex(holiday => {
      return moment(holiday.date).format("MM-DD-YYYY") === moment(date).format("MM-DD-YYYY");
  });
  return idx !== -1;
}
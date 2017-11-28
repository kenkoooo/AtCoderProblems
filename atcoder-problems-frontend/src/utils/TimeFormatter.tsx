import * as moment from "moment";

export class TimeFormatter {
  static getDateString(currentTimeMillis: number): string {
    let date = moment(currentTimeMillis);
    return date.local().format("Y-MM-DD");
  }
}

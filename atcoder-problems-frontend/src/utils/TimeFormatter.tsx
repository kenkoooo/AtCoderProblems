import * as moment from "moment-timezone";

export class TimeFormatter {
  static getDateString(currentTimeMillis: number): string {
    let date = moment(currentTimeMillis);
    return date.tz("Asia/Tokyo").format("Y-MM-DD");
  }
}

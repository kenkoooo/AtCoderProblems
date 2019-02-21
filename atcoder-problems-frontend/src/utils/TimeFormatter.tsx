import { format } from "date-fns";

export class TimeFormatter {
  static getDateString(currentTimeMillis: number): string {
    let tokyo_string = new Date(currentTimeMillis).toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
    return format(new Date(tokyo_string), "YYYY-MM-DD");
  }
}

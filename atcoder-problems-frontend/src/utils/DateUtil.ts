import moment from "moment";

const DATE_FORMAT = "YYYY-MM-DD";
const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const parseSecond = (epochSecond: number) => moment.unix(epochSecond);

export const parseDateLabel = (dateLabel: string) =>
  moment(dateLabel, DATE_FORMAT);

export const formatMomentDate = (t: moment.Moment) => t.format(DATE_FORMAT);
export const formatMomentDateTime = (t: moment.Moment) =>
  t.format(DATETIME_FORMAT);

export const getNextSunday = (t: moment.Moment) => {
  const date = t.date();
  const weekday = t.weekday();
  return t.date(date + 7 - weekday);
};

export const getToday = () => moment();

import moment from "moment";

const JST_OFFSET = "+09:00";
const DATE_FORMAT = "YYYY-MM-DD";

export const parseSecond = (epochSecond: number) =>
  moment.unix(epochSecond).utcOffset(JST_OFFSET);

export const parseDateLabel = (dateLabel: string) =>
  moment(dateLabel, DATE_FORMAT).utcOffset(JST_OFFSET);

export const formatMoment = (t: moment.Moment) => t.format(DATE_FORMAT);

export const getThisSunday = (t: moment.Moment) => {
  const date = t.date();
  const weekday = t.weekday();
  return t.date(date + ((7 - weekday) % 7));
};

export const getToday = () => moment().utcOffset(JST_OFFSET);

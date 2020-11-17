import moment from "moment";

const DATE_FORMAT = "YYYY-MM-DD";
const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
const DATETIME_DAY_FORMAT = "YYYY-MM-DD HH:mm:ss (ddd)";

export const parseSecond = (epochSecond: number): moment.Moment =>
  moment.unix(epochSecond);

export const parseDateLabel = (dateLabel: string): moment.Moment =>
  moment(dateLabel, DATE_FORMAT);

export const formatMomentDate = (t: moment.Moment): string =>
  t.format(DATE_FORMAT);
export const formatMomentDateTime = (t: moment.Moment): string =>
  t.format(DATETIME_FORMAT);
export const formatMomentDateTimeDay = (t: moment.Moment): string =>
  t.format(DATETIME_DAY_FORMAT);

export const getNextSunday = (t: moment.Moment): moment.Moment => {
  const date = t.date();
  const weekday = t.weekday();
  return t.date(date + 7 - weekday);
};

export const getToday = (): moment.Moment => moment();
export const formatDuration = (durationSecond: number): string => {
  const hours = Math.floor(durationSecond / 3600);
  const minutes = Math.floor(durationSecond / 60) - hours * 60;
  const seconds = durationSecond - hours * 3600 - minutes * 60;

  const mm = minutes < 10 ? `0${minutes}` : minutes.toString();
  const ss = seconds < 10 ? `0${seconds}` : seconds.toString();
  return `${hours}:${mm}:${ss}`;
};

export const getNowMillis = () => Math.floor(Date.now() / 1000);

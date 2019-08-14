export const formatDateSecond = (epochSecond: number) => {
  const date = new Date(epochSecond * 1000);
  return formatDate(date);
};

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const month_str = month < 10 ? "0" + month : month;
  const day_str = day < 10 ? "0" + day : day;
  return year + "-" + month_str + "-" + day_str;
};

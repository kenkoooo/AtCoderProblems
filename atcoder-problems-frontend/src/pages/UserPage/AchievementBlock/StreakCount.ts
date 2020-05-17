import { formatMomentDate, parseDateLabel } from "../../../utils/DateUtil";

export const calcStreak = (
  dailyCount: { dateLabel: string; count: number }[]
): {
  longestStreak: number;
  currentStreak: number;
  prevDateLabel: string;
} => {
  return dailyCount
    .map((e) => e.dateLabel)
    .reduce(
      (state, dateLabel) => {
        const nextDateLabel = formatMomentDate(
          parseDateLabel(state.prevDateLabel).add(1, "day")
        );
        // tslint:disable-next-line
        const currentStreak =
          dateLabel === nextDateLabel ? state.currentStreak + 1 : 1;
        // tslint:disable-next-line
        const longestStreak = Math.max(state.longestStreak, currentStreak);
        return { longestStreak, currentStreak, prevDateLabel: dateLabel };
      },
      {
        longestStreak: 0,
        currentStreak: 0,
        prevDateLabel: "",
      }
    );
};

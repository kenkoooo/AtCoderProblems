import { ProblemId } from "../interfaces/Status";
import Submission from "../interfaces/Submission";
import ProblemModel, {
  isProblemModelWithTimeModel,
} from "../interfaces/ProblemModel";
import { formatMomentDate, parseDateLabel, parseSecond } from "./DateUtil";
import { calculateTopPlayerEquivalentEffort } from "./ProblemModelUtil";
import { isAccepted } from "./index";

export interface Streak {
  longestStreak: number;
  currentStreak: number;
  prevDateLabel: string;
}

export const calcStreak = (
  dailyCount: { dateLabel: string; count: number }[]
): Streak => {
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

export const countUniqueAcByDate = (
  userSubmissions: Submission[]
): { dateLabel: string; count: number }[] => {
  const submissionMap = new Map<ProblemId, Submission>();
  userSubmissions
    .filter((s) => isAccepted(s.result))
    .forEach((submission) => {
      const current = submissionMap.get(submission.problem_id);
      if (current) {
        if (current.id > submission.id) {
          submissionMap.set(submission.problem_id, submission);
        }
      } else {
        submissionMap.set(submission.problem_id, submission);
      }
    });

  const dailyCount = Array.from(submissionMap)
    .map(([, s]) => formatMomentDate(parseSecond(s.epoch_second)))
    .reduce((map, date) => {
      const count = map.get(date) ?? 0;
      map.set(date, count + 1);
      return map;
    }, new Map<string, number>());
  return Array.from(dailyCount)
    .map(([dateLabel, count]) => ({ dateLabel, count }))
    .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
};

export const countTeeByDate = (
  userSubmissions: Submission[],
  problemModelsMap?: Map<string, ProblemModel>
) => {
  const getTeeFromSubmission = (problemId: string): number => {
    const detail = problemModelsMap?.get(problemId);
    if (isProblemModelWithTimeModel(detail)) {
      return calculateTopPlayerEquivalentEffort(detail);
    } else {
      return 0;
    }
  };

  const submissionMap = new Map<ProblemId, Submission>();
  userSubmissions
    .filter((s) => isAccepted(s.result))
    .forEach((submission) => {
      const current = submissionMap.get(submission.problem_id);
      if (current) {
        if (current.id > submission.id) {
          submissionMap.set(submission.problem_id, submission);
        }
      } else {
        submissionMap.set(submission.problem_id, submission);
      }
    });

  const dailyTeeCount = Array.from(submissionMap)
    .map(([k, v]) => {
      return {
        date: formatMomentDate(parseSecond(v.epoch_second)),
        tee: getTeeFromSubmission(k),
      };
    })
    .reduce((map, o) => {
      const count = map.get(o.date) ?? 0;
      map.set(o.date, count + o.tee);
      return map;
    }, new Map<string, number>());

  return Array.from(dailyTeeCount)
    .map(([dateLabel, count]) => ({ dateLabel, count }))
    .sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
};

export const countTeeMovingAverage = (
  dailyTeeCount: {
    dateLabel: string;
    count: number;
  }[]
) => {
  const DURATION = 30;
  if (!Array.isArray(dailyTeeCount) || dailyTeeCount.length === 0) {
    return [];
  }

  const minDateLabel = dailyTeeCount[0].dateLabel;
  const maxDateLabel = dailyTeeCount[dailyTeeCount.length - 1].dateLabel;
  const dateDelta =
    1 +
    (new Date(maxDateLabel).getTime() - new Date(minDateLabel).getTime()) /
      1000 /
      86400;

  const differentiatedTees = Array.from(Array(dateDelta)).map((__, i) => {
    const nextDate = new Date(minDateLabel);
    nextDate.setDate(nextDate.getDate() + i);
    const nextDateLabel = nextDate.toISOString().substring(0, 10);
    const found = dailyTeeCount.find((tee) => tee.dateLabel === nextDateLabel);
    if (found) {
      return found;
    } else {
      return { dateLabel: nextDateLabel, count: 0 };
    }
  });

  return differentiatedTees
    .map(({ dateLabel }, i) => {
      const dateSecond = parseDateLabel(dateLabel).unix();
      const begin = Math.max(i - (DURATION - 1), 0);
      const total = differentiatedTees
        .slice(begin, i + 1)
        .reduce((tot, data) => data.count + tot, 0);
      if (!total) {
        return null;
      }
      return { dateSecond, count: total / DURATION };
    })
    .filter((data): data is { dateSecond: number; count: number } => !!data);
};

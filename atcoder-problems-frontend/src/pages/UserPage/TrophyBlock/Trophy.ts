import ProblemModel from "../../../interfaces/ProblemModel";
import Submission from "../../../interfaces/Submission";

export interface Trophy {
  title: string;
  reason: string;
  achieved: boolean;
  sortId: string;
  group: TrophyGroup;
}

export enum TrophyGroup {
  AC_COUNT = "AC Count",
  STREAK = "Streak",
  PROBLEMS = "Problems",
  CONTESTS = "Contests",
}

export interface TrophySubmission {
  submission: Submission;
  problemModel: ProblemModel | undefined;
}

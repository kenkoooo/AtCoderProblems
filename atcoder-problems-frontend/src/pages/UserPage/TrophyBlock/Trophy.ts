import ProblemModel from "../../../interfaces/ProblemModel";
import Submission from "../../../interfaces/Submission";

export interface Trophy {
  title: string;
  reason: string;
  achieved: boolean;
  sortId: string;
}

export interface TrophySubmission {
  submission: Submission;
  problemModel: ProblemModel | undefined;
}

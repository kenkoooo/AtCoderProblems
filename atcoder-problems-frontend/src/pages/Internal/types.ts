import Submission from "../../interfaces/Submission";
import { caseInsensitiveUserId } from "../../utils";

export interface UserResponse {
  readonly internal_user_id: string;
  readonly atcoder_user_id: string | null;
}

export interface ProblemList {
  internal_list_id: string;
  internal_list_name: string;
  internal_user_id: string;
  items: ProblemListItem[];
}

export interface ProblemListItem {
  problem_id: string;
  memo: string;
}

export interface VirtualContestInfo {
  readonly id: string;
  readonly title: string;
  readonly memo: string;
  readonly owner_user_id: string;
  readonly start_epoch_second: number;
  readonly duration_second: number;
  readonly mode: VirtualContestMode;
  readonly is_public: boolean;
  readonly penalty_second: number;
}

export interface VirtualContestDetails {
  readonly info: VirtualContestInfo;
  readonly problems: VirtualContestItem[];
  readonly participants: string[];
}

export interface VirtualContestItem {
  readonly id: string;
  readonly point: number | null;
  readonly order: number | null;
}

export interface VirtualContestProblem {
  item: VirtualContestItem;
  title?: string;
  contestId?: string;
}

export type VirtualContestMode = null | "lockout" | "training";
export const formatMode = (
  mode: VirtualContestMode
): "Lockout" | "Training" | "Normal" => {
  switch (mode) {
    case "lockout":
      return "Lockout";
    case "training":
      return "Training";
    case null:
      return "Normal";
  }
};

export const formatPublicState = (
  publicState: boolean
): "Public" | "Private" => {
  switch (publicState) {
    case true:
      return "Public";
    case false:
      return "Private";
  }
};

export interface ProgressResetList {
  items: ProgressResetItem[];
}

export interface ProgressResetItem {
  problem_id: string;
  reset_epoch_second: number;
}

export const filterResetProgress = (
  submissions: Submission[],
  progressReset: ProgressResetList,
  userId: string
): Submission[] =>
  submissions.filter((submission) => {
    if (
      caseInsensitiveUserId(submission.user_id) !==
      caseInsensitiveUserId(userId)
    ) {
      return true;
    }
    const resetEpochSecond =
      progressReset.items.find(
        (item) => item.problem_id === submission.problem_id
      )?.reset_epoch_second ?? 0;
    return submission.epoch_second > resetEpochSecond;
  });

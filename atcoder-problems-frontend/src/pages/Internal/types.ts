import Submission from "../../interfaces/Submission";

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
}

export interface VirtualContest extends VirtualContestInfo {
  readonly problems: VirtualContestItem[];
  readonly participants: string[];
}

export interface VirtualContestItem {
  readonly id: string;
  readonly point: number | null;
  readonly order: number | null;
}

export type VirtualContestMode = null | "lockout";
export const formatMode = (mode: VirtualContestMode): "Lockout" | "Normal" => {
  switch (mode) {
    case "lockout":
      return "Lockout";
    case null:
      return "Normal";
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
  submissions.filter(submission => {
    if (submission.user_id !== userId) {
      return true;
    }
    const resetEpochSecond =
      progressReset.items.find(
        item => item.problem_id === submission.problem_id
      )?.reset_epoch_second ?? 0;
    return submission.epoch_second > resetEpochSecond;
  });

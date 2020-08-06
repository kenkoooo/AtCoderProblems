import { CONTEST_CREATE, CONTEST_ITEM_UPDATE, CONTEST_UPDATE } from "../ApiUrl";
import { VirtualContestItem, VirtualContestMode } from "../types";

export interface CreateContestRequest {
  title: string;
  memo: string;
  start_epoch_second: number;
  duration_second: number;
  mode: VirtualContestMode;
  is_public: boolean;
  penalty_second: number;
}
export interface CreateContestResponse {
  contest_id: string;
}

export const createVirtualContest = (request: CreateContestRequest) =>
  fetch(CONTEST_CREATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })
    .then((response) => response.json())
    .then((response) => response as CreateContestResponse);

export interface UpdateContestRequest {
  id: string;
  title: string;
  memo: string;
  start_epoch_second: number;
  duration_second: number;
  mode: string | null;
  is_public: boolean;
  penalty_second: number;
}
export const updateVirtualContestInfo = (request: UpdateContestRequest) =>
  fetch(CONTEST_UPDATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

export const updateVirtualContestItems = (
  contestId: string,
  problems: VirtualContestItem[]
) =>
  fetch(CONTEST_ITEM_UPDATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contest_id: contestId,
      problems: problems.map((p, i) => ({
        ...p,
        order: i,
      })),
    }),
  }).then(() => ({}));

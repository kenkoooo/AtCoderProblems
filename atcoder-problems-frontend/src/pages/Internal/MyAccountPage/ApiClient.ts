import { PROGRESS_RESET_ADD, PROGRESS_RESET_DELETE } from "../ApiUrl";
import { getCurrentUnixtimeInSecond } from "../../../utils/DateUtil";

export const addResetProgress = (problemId: string) =>
  fetch(PROGRESS_RESET_ADD, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      problem_id: problemId,
      reset_epoch_second: getCurrentUnixtimeInSecond(),
    }),
  });

export const deleteResetProgress = (problemId: string) =>
  fetch(PROGRESS_RESET_DELETE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      problem_id: problemId,
    }),
  });

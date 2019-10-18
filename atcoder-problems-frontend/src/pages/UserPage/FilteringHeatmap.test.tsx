import { filterSubmissions } from "./FilteringHeatmap";
import Submission from "../../interfaces/Submission";

const emptySubmission: Submission = {
  execution_time: null,
  point: 0.0,
  result: "",
  problem_id: "",
  user_id: "",
  epoch_second: 0,
  contest_id: "",
  id: 0,
  language: "",
  length: 0
};
const submissions = [
  {
    ...emptySubmission,
    epoch_second: 1,
    result: "AC",
    problem_id: "problem_1"
  },
  {
    ...emptySubmission,
    epoch_second: 2,
    result: "AC",
    problem_id: "problem_1"
  }
];

describe("filter", () => {
  it("unique ac submissions", () => {
    const filtered = filterSubmissions(submissions, "Unique AC");
    expect(filtered.length).toBe(1);
    expect(filtered[0].epoch_second).toBe(1);
  });
});

import { Problem } from "./Problem";

export interface MergedProblem extends Problem {
  first_submission_id: number;
  solver_count: number;
  fastest_user_id: string;
  execution_time: number;
  shortest_user_id: string;
  shortest_submission_id: number;
  contestId: string;
  id: string;
  fastest_submission_id: number;
  first_user_id: string;
  title: string;
  source_code_length: number;
}

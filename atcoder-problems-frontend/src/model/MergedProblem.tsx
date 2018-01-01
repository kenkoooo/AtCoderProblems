import { Problem } from "./Problem";

export interface MergedProblem extends Problem {
  id: string;
  contest_id: string;
  solver_count: number;
  title: string;

  first_user_id?: string;
  first_contest_id?: string;
  first_submission_id?: number;

  fastest_user_id?: string;
  fastest_contest_id?: string;
  fastest_submission_id?: number;
  execution_time?: number;

  shortest_user_id?: string;
  shortest_contest_id?: string;
  shortest_submission_id?: number;
  source_code_length?: number;

  point?: number;
  predict?: number;
}

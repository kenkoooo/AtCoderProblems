export default interface MergedProblem {
  // Basic information
  id: string;
  contest_id: string;
  title: string;

  // Information for first AC
  first_user_id: string;
  first_contest_id: string;
  first_submission_id: number;

  // Information for fastest code
  fastest_user_id: string;
  fastest_contest_id: string;
  fastest_submission_id: number;
  execution_time: number;

  // Information for shortest code
  shortest_user_id: string;
  shortest_contest_id: string;
  shortest_submission_id: number;
  source_code_length: number;

  solver_count: number;

  predict?: number;
  point?: number;
}

export default interface MergedProblem {
  // Basic information
  id: string;
  contest_id: string;
  title: string;

  // Information for first AC
  first_user_id: string | null;
  first_contest_id: string | null;
  first_submission_id: number | null;

  // Information for fastest code
  fastest_user_id: string | null;
  fastest_contest_id: string | null;
  fastest_submission_id: number | null;
  execution_time: number | null;

  // Information for shortest code
  shortest_user_id: string | null;
  shortest_contest_id: string | null;
  shortest_submission_id: number | null;
  source_code_length: number | null;

  solver_count: number | null;

  predict?: number | null;
  point?: number | null;
}

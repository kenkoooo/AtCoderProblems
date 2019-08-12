export default interface MergedProblem {
  // Basic information
  readonly id: string;
  readonly contest_id: string;
  readonly title: string;

  // Information for first AC
  readonly first_user_id: string | null;
  readonly first_contest_id: string | null;
  readonly first_submission_id: number | null;

  // Information for fastest code
  readonly fastest_user_id: string | null;
  readonly fastest_contest_id: string | null;
  readonly fastest_submission_id: number | null;
  readonly execution_time: number | null;

  // Information for shortest code
  readonly shortest_user_id: string | null;
  readonly shortest_contest_id: string | null;
  readonly shortest_submission_id: number | null;
  readonly source_code_length: number | null;

  readonly solver_count: number | null;

  readonly predict?: number | null;
  readonly point?: number | null;
}

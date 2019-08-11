export default interface Submission {
  readonly execution_time: number;
  readonly point: number;
  readonly result: string;
  readonly problem_id: string;
  readonly user_id: string;
  readonly epoch_second: number;
  readonly contest_id: string;
  readonly id: number;
  readonly language: string;
  readonly length: number;
}

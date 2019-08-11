export default interface Contest {
  readonly start_epoch_second: number;
  readonly rate_change: string;
  readonly id: string;
  readonly duration_second: number;
  readonly title: string;
}

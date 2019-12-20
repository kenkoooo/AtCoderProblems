export interface VirtualContest {
  readonly id: string;
  readonly title: string;
  readonly memo: string;
  readonly owner_user_id: string;
  readonly start_epoch_second: number;
  readonly duration_second: number;
  readonly problems: string[];
  readonly participants: string[];
}

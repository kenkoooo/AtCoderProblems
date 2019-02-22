const FIRST_AGC_START_EPOCH_SECOND = 1468670400;

export class Contest {
  id: string;
  title: string;
  start_epoch_second: number;
  rate_change: string;

  constructor(id: string, title: string, start_epoch_second: number, rate_change: string) {
    this.id = id;
    this.title = title;
    this.start_epoch_second = start_epoch_second;
    this.rate_change = rate_change;
  }
  isRated(): boolean {
    if (this.id === "utpc2011") {
      console.log(this);
      console.log(this.rate_change.match(/[-x]/));
    }
    return this.rate_change.match(/[-x]/) == null && this.start_epoch_second >= FIRST_AGC_START_EPOCH_SECOND;
  }
}
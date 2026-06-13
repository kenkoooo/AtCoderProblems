export interface Course {
  readonly title: string;
  readonly set_list: {
    readonly order: number;
    readonly title: string;
    readonly problems: {
      readonly order: number;
      readonly problem_id: string;
    }[];
  }[];
}

export default interface UserInfo {
  readonly accepted_count_rank: number;
  readonly rated_point_sum_rank: number;
  readonly rated_point_sum: number;
  readonly user_id: string;
  readonly accepted_count: number;
}

export const isUserInfo = (obj: any): obj is UserInfo =>
  typeof obj.user_id === "string" &&
  typeof obj.accepted_count === "number" &&
  typeof obj.accepted_count_rank === "number" &&
  typeof obj.rated_point_sum === "number" &&
  typeof obj.rated_point_sum_rank === "number";

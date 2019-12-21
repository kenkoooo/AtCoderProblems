export interface ProblemList {
  internal_list_id: string;
  internal_list_name: string;
  items: ProblemListItem[];
}

export interface ProblemListItem {
  problem_id: string;
  memo: string;
}

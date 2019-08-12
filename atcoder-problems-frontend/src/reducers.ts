import State from "./interfaces/State";
import { Map, List } from "immutable";
import Submission from "./interfaces/Submission";

import Action, {
  CLEAR_SUBMISSIONS,
  RECEIVE_CONTEST_PROBLEM_PAIR,
  RECEIVE_CONTESTS,
  RECEIVE_MERGED_PROBLEMS,
  RECEIVE_PERF,
  RECEIVE_PROBLEMS,
  RECEIVE_SUBMISSIONS,
  RECEIVE_USER_INFO,
  UPDATE_USER_IDS
} from "./actions";
import MergedProblem from "./interfaces/MergedProblem";
import Problem from "./interfaces/Problem";
import UserInfo from "./interfaces/UserInfo";
import Contest from "./interfaces/Contest";

const initialState: State = {
  users: {
    userId: "",
    rivals: List()
  },
  contests: Map(),
  problems: Map(),
  mergedProblems: Map(),
  submissions: Map(),
  contestToProblems: Map(),
  userInfo: undefined,
  problemPerformances: Map()
};

const mergedProblemReducer = (
  mergedProblems: Map<string, MergedProblem>,
  action: Action
) => {
  switch (action.type) {
    case RECEIVE_MERGED_PROBLEMS: {
      return action.mergedProblems.reduce(
        (map, problem) => map.set(problem.id, problem),
        Map<string, MergedProblem>()
      );
    }
    default: {
      return mergedProblems;
    }
  }
};

const problemReducer = (problems: Map<string, Problem>, action: Action) => {
  switch (action.type) {
    case RECEIVE_PROBLEMS: {
      return action.problems.reduce(
        (map, problem) => map.set(problem.id, problem),
        Map<string, Problem>()
      );
    }
    default: {
      return problems;
    }
  }
};

const usersReducer = (
  users: { userId: string; rivals: List<string> },
  action: Action
) => {
  switch (action.type) {
    case UPDATE_USER_IDS: {
      const { userId, rivals } = action;
      return { userId, rivals };
    }
    default: {
      return users;
    }
  }
};

const submissionReducer = (
  submissions: Map<string, List<Submission>>,
  action: Action
) => {
  switch (action.type) {
    case CLEAR_SUBMISSIONS: {
      return submissions.clear();
    }
    case RECEIVE_SUBMISSIONS: {
      return action.submissions.reduce(
        (map, submission) =>
          map.update(submission.problem_id, List<Submission>(), list =>
            list.push(submission)
          ),
        submissions
      );
    }
    default: {
      return submissions;
    }
  }
};

const contestToProblemsReducer = (
  contestToProblems: Map<string, List<string>>,
  action: Action
) => {
  switch (action.type) {
    case RECEIVE_CONTEST_PROBLEM_PAIR: {
      return action.contestProblemPairs.reduce(
        (map, { contest_id, problem_id }) =>
          map.update(contest_id, List<string>(), list => list.push(problem_id)),
        Map<string, List<string>>()
      );
    }
    default: {
      return contestToProblems;
    }
  }
};

const userInfoReducer = (userInfo: UserInfo | undefined, action: Action) => {
  switch (action.type) {
    case RECEIVE_USER_INFO: {
      return action.userInfo;
    }
    default: {
      return userInfo;
    }
  }
};

const performanceReducer = (
  problemPerformances: Map<string, number>,
  action: Action
) => {
  switch (action.type) {
    case RECEIVE_PERF: {
      return action.perf.reduce(
        (map, p) => map.set(p.problem_id, p.minimum_performance),
        Map<string, number>()
      );
    }
    default: {
      return problemPerformances;
    }
  }
};

const contestReducer = (contests: Map<string, Contest>, action: Action) => {
  switch (action.type) {
    case RECEIVE_CONTESTS: {
      return action.contests.reduce(
        (map, contest) => map.set(contest.id, contest),
        Map<string, Contest>()
      );
    }
    default: {
      return contests;
    }
  }
};

const rootReducer = (state: State = initialState, action: Action): State => {
  return {
    submissions: submissionReducer(state.submissions, action),
    contestToProblems: contestToProblemsReducer(
      state.contestToProblems,
      action
    ),
    users: usersReducer(state.users, action),
    problems: problemReducer(state.problems, action),
    mergedProblems: mergedProblemReducer(state.mergedProblems, action),
    userInfo: userInfoReducer(state.userInfo, action),
    problemPerformances: performanceReducer(state.problemPerformances, action),
    contests: contestReducer(state.contests, action)
  };
};

export default rootReducer;

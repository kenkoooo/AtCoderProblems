import State from "./interfaces/State";
import { Map, List } from "immutable";
import Submission from "./interfaces/Submission";

import Action, {
  CLEAR_SUBMISSIONS,
  RECEIVE_INITIAL_DATA,
  RECEIVE_MERGED_PROBLEMS,
  RECEIVE_PERF,
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

const dataReducer = (
  problems: Map<string, Problem>,
  contests: Map<string, Contest>,
  contestToProblems: Map<string, List<string>>,
  action: Action
) => {
  switch (action.type) {
    case RECEIVE_INITIAL_DATA: {
      const newProblems = action.problems.reduce(
        (map, problem) => map.set(problem.id, problem),
        Map<string, Problem>()
      );
      const newContests = action.contests.reduce(
        (map, contest) => map.set(contest.id, contest),
        Map<string, Contest>()
      );
      const newContestToProblems = action.pairs.reduce(
        (map, { contest_id, problem_id }) =>
          map.update(contest_id, List<string>(), list => list.push(problem_id)),
        Map<string, List<string>>()
      );
      return {
        problems: newProblems,
        contests: newContests,
        contestToProblems: newContestToProblems
      };
    }
    default: {
      return {
        problems,
        contests,
        contestToProblems
      };
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

const rootReducer = (state: State = initialState, action: Action): State => {
  const { contests, problems, contestToProblems } = dataReducer(
    state.problems,
    state.contests,
    state.contestToProblems,
    action
  );
  return {
    submissions: submissionReducer(state.submissions, action),
    contestToProblems,
    users: usersReducer(state.users, action),
    problems,
    mergedProblems: mergedProblemReducer(state.mergedProblems, action),
    userInfo: userInfoReducer(state.userInfo, action),
    problemPerformances: performanceReducer(state.problemPerformances, action),
    contests
  };
};

export default rootReducer;

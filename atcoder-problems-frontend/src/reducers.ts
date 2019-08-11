import State from "./interfaces/State";
import { Map, List } from "immutable";
import Submission from "./interfaces/Submission";

import Action, {
  CLEAR_SUBMISSIONS,
  RECEIVE_CONTEST_PROBLEM_PAIR,
  RECEIVE_SUBMISSIONS,
  UPDATE_USER_IDS
} from "./actions";

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
  userInfo: undefined
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

const rootReducer = (state: State = initialState, action: Action) => {
  return {
    ...state,
    submissions: submissionReducer(state.submissions, action),
    contestToProblems: contestToProblemsReducer(
      state.contestToProblems,
      action
    ),
    users: usersReducer(state.users, action)
  };
};

export default rootReducer;

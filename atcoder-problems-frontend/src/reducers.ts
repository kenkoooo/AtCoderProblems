import State, {
  failedStatus,
  noneStatus,
  ProblemId,
  ProblemStatus,
  successStatus,
  warningStatus
} from "./interfaces/State";
import { Map, List } from "immutable";
import Submission from "./interfaces/Submission";

import Action, {
  RECEIVE_AC_RANKING,
  RECEIVE_INITIAL_DATA,
  RECEIVE_LANG_RANKING,
  RECEIVE_MERGED_PROBLEMS,
  RECEIVE_PERF,
  RECEIVE_SUBMISSIONS,
  RECEIVE_SUM_RANKING,
  RECEIVE_USER_INFO,
  UPDATE_USER_IDS
} from "./actions";
import MergedProblem from "./interfaces/MergedProblem";
import Problem from "./interfaces/Problem";
import UserInfo from "./interfaces/UserInfo";
import Contest from "./interfaces/Contest";
import {
  LangRankingEntry,
  RankingEntry,
  SumRankingEntry
} from "./interfaces/RankingEntry";
import { isAccepted } from "./utils";

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
  problemPerformances: Map(),
  acRanking: List(),
  sumRanking: List(),
  langRanking: List(),
  cache: {
    statusLabelMap: Map()
  }
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
  if (action.type === RECEIVE_SUBMISSIONS) {
    return action.submissions.reduce(
      (map, submission) =>
        map.update(submission.problem_id, List<Submission>(), list =>
          list.push(submission)
        ),
      Map<ProblemId, List<Submission>>()
    );
  } else {
    return submissions;
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

const acRankingReducer = (acRanking: List<RankingEntry>, action: Action) => {
  if (action.type === RECEIVE_AC_RANKING) {
    return action.ranking;
  } else {
    return acRanking;
  }
};

const sumRankingReducer = (
  sumRanking: List<SumRankingEntry>,
  action: Action
) => {
  if (action.type === RECEIVE_SUM_RANKING) {
    return action.ranking;
  } else {
    return sumRanking;
  }
};

const langRankingReducer = (
  langRanking: List<LangRankingEntry>,
  action: Action
) => {
  if (action.type === RECEIVE_LANG_RANKING) {
    return action.ranking;
  } else {
    return langRanking;
  }
};

const statusLabelMapReducer = (
  statusLabelMap: Map<ProblemId, ProblemStatus>,
  submissions: Map<ProblemId, List<Submission>>,
  userId: string,
  rivals: List<string>,
  action: Action
): Map<ProblemId, ProblemStatus> => {
  if (action.type === RECEIVE_SUBMISSIONS) {
    return submissions.map(list => {
      const userList = list.filter(s => s.user_id === userId);
      const rivalsList = list
        .filter(s => rivals.contains(s.user_id))
        .filter(s => isAccepted(s.result));
      if (userList.find(s => isAccepted(s.result))) {
        return successStatus();
      } else if (!rivalsList.isEmpty()) {
        return failedStatus(
          rivalsList
            .map(s => s.user_id)
            .toSet()
            .toList()
        );
      } else {
        const last = userList.maxBy(s => s.epoch_second);
        return last ? warningStatus(last.result) : noneStatus();
      }
    });
  } else {
    return statusLabelMap;
  }
};

const rootReducer = (state: State = initialState, action: Action): State => {
  performance.mark("reducer_start");
  const { contests, problems, contestToProblems } = dataReducer(
    state.problems,
    state.contests,
    state.contestToProblems,
    action
  );
  const submissions = submissionReducer(state.submissions, action);
  const users = usersReducer(state.users, action);
  const mergedProblems = mergedProblemReducer(state.mergedProblems, action);
  const userInfo = userInfoReducer(state.userInfo, action);
  const problemPerformances = performanceReducer(
    state.problemPerformances,
    action
  );
  const sumRanking = sumRankingReducer(state.sumRanking, action);
  const acRanking = acRankingReducer(state.acRanking, action);
  const langRanking = langRankingReducer(state.langRanking, action);

  const statusLabelMap = statusLabelMapReducer(
    state.cache.statusLabelMap,
    submissions,
    state.users.userId,
    state.users.rivals,
    action
  );
  performance.mark("reducer_end");
  performance.measure("reducer", "reducer_start", "reducer_end");

  return {
    submissions,
    contestToProblems,
    users,
    problems,
    mergedProblems,
    userInfo,
    problemPerformances,
    contests,
    sumRanking,
    acRanking,
    langRanking,
    cache: {
      statusLabelMap
    }
  };
};

export default rootReducer;

import State, {
  ContestId,
  failedStatus,
  noneStatus,
  ProblemId,
  ProblemStatus,
  successStatus,
  warningStatus
} from "./interfaces/State";
import { Map, List, Set } from "immutable";
import Submission from "./interfaces/Submission";

import Action, {
  RECEIVE_AC_RANKING,
  RECEIVE_INITIAL_DATA,
  RECEIVE_LANG_RANKING,
  RECEIVE_MERGED_PROBLEMS,
  RECEIVE_STREAK_RANKING,
  RECEIVE_SUBMISSIONS,
  RECEIVE_SUM_RANKING,
  RECEIVE_USER_CONTEST_HISTORY,
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
  StreakRankingEntry,
  SumRankingEntry
} from "./interfaces/RankingEntry";
import { isAccepted, clipDifficulty } from "./utils";
import ProblemModel from "./interfaces/ProblemModel";
import ContestParticipation from "./interfaces/ContestParticipation";

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
  acRanking: List(),
  sumRanking: List(),
  langRanking: List(),
  streakRanking: List(),
  contestHistory: List(),
  problemModels: Map(),
  abc: Map(),
  arc: Map(),
  agc: Map(),
  othersRated: Map(),
  others: Map(),
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
  state: {
    problems: Map<string, Problem>;
    contests: Map<string, Contest>;
    contestToProblems: Map<ContestId, List<Problem>>;
    problemModels: Map<string, ProblemModel>;
    abc: Map<ContestId, Contest>;
    arc: Map<ContestId, Contest>;
    agc: Map<ContestId, Contest>;
    othersRated: Map<ContestId, Contest>;
    others: Map<ContestId, Contest>;
  },

  action: Action
) => {
  switch (action.type) {
    case RECEIVE_INITIAL_DATA: {
      const problems = action.problems.reduce(
        (map, problem) => map.set(problem.id, problem),
        Map<string, Problem>()
      );
      const contests = action.contests.reduce(
        (map, contest) => map.set(contest.id, contest),
        Map<string, Contest>()
      );
      const contestToProblems = action.pairs
        .map(({ contest_id, problem_id }) => ({
          contest_id,
          problem: problems.get(problem_id)
        }))
        .reduce((map, { contest_id, problem }) => {
          if (problem === undefined) {
            return map;
          } else {
            return map.update(contest_id, List<Problem>(), list =>
              list.push(problem)
            );
          }
        }, Map<ContestId, List<Problem>>());
      const abc = contests.filter((v, k) => k.match(/^abc\d{3}$/));
      const arc = contests.filter((v, k) => k.match(/^arc\d{3}$/));
      const agc = contests.filter((v, k) => k.match(/^agc\d{3}$/));
      const atcoderContestIds = [abc, arc, agc]
        .map(s => s.keySeq())
        .reduce((set, keys) => set.concat(keys), Set<ContestId>());

      const othersRated = contests
        .filter(contest => !atcoderContestIds.has(contest.id))
        .filter(contest => contest.rate_change !== "-")
        .filter(contest => contest.start_epoch_second >= 1468670400); // agc001
      const ratedContestIds = atcoderContestIds.concat(othersRated.keySeq());
      const others = contests.filter(c => !ratedContestIds.has(c.id));

      const problemModels = action.problemModels.map(
        (model: ProblemModel): ProblemModel => {
          if (model.difficulty === undefined) {
            return model;
          }
          return {
            ...model,
            difficulty: clipDifficulty(model.difficulty),
            rawDifficulty: model.difficulty
          };
        }
      );

      return {
        problems,
        contests,
        contestToProblems,
        problemModels,
        abc,
        arc,
        agc,
        others,
        othersRated
      };
    }
    default: {
      return state;
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

const userContestHistoryReducer = (
  userContestHistory: List<ContestParticipation>,
  action: Action
) => {
  if (action.type === RECEIVE_USER_CONTEST_HISTORY) {
    return action.contestHistory;
  } else {
    return userContestHistory;
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

const streakRankingReducer = (
  streakRanking: List<StreakRankingEntry>,
  action: Action
) => {
  if (action.type === RECEIVE_STREAK_RANKING) {
    return action.ranking;
  } else {
    return streakRanking;
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
  const {
    contests,
    problems,
    contestToProblems,
    problemModels,
    abc,
    arc,
    agc,
    others,
    othersRated
  } = dataReducer(
    {
      problems: state.problems,
      contests: state.contests,
      contestToProblems: state.contestToProblems,
      problemModels: state.problemModels,
      abc: state.abc,
      arc: state.arc,
      agc: state.agc,
      others: state.others,
      othersRated: state.othersRated
    },
    action
  );
  const submissions = submissionReducer(state.submissions, action);
  const users = usersReducer(state.users, action);
  const mergedProblems = mergedProblemReducer(state.mergedProblems, action);
  const userInfo = userInfoReducer(state.userInfo, action);
  const sumRanking = sumRankingReducer(state.sumRanking, action);
  const acRanking = acRankingReducer(state.acRanking, action);
  const langRanking = langRankingReducer(state.langRanking, action);
  const streakRanking = streakRankingReducer(state.streakRanking, action);
  const contestHistory = userContestHistoryReducer(
    state.contestHistory,
    action
  );

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
    contests,
    sumRanking,
    acRanking,
    langRanking,
    streakRanking,
    contestHistory,
    problemModels,
    abc,
    arc,
    agc,
    others,
    othersRated,
    cache: {
      statusLabelMap
    }
  };
};

export default rootReducer;

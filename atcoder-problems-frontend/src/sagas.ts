import { all, call, put, takeLatest, take } from "redux-saga/effects";
import Action, {
  receiveAcRanking,
  receiveInitialData,
  receiveLangRanking,
  receiveMergedProblems,
  receiveStreakRanking,
  receiveSubmissions,
  receiveSumRanking,
  receiveUserContestHistory,
  receiveUserInfo,
  REQUEST_AC_RANKING,
  REQUEST_LANG_RANKING,
  REQUEST_MERGED_PROBLEMS,
  REQUEST_STREAK_RANKING,
  REQUEST_SUM_RANKING,
  UPDATE_USER_IDS
} from "./actions";
import {
  fetchACRanking,
  fetchContestHistory,
  fetchContestProblemPairs,
  fetchContests,
  fetchLangRanking,
  fetchMergedProblems,
  fetchProblems,
  fetchProblemModels,
  fetchSubmissions,
  fetchSumRanking,
  fetchUserInfo,
  fetchStreaks
} from "./utils/Api";
import Submission from "./interfaces/Submission";
import { List } from "immutable";

function* requestAndReceiveSubmissions(action: Action) {
  if (action.type === UPDATE_USER_IDS) {
    const { userId, rivals } = action;
    const submissionLists: List<Submission>[] = yield all(
      rivals
        .push(userId)
        .toArray()
        .map(id => call(fetchSubmissions, id))
    );
    const submissions = submissionLists.reduce(
      (ss, list) => ss.concat(list),
      List<Submission>()
    );
    yield put(receiveSubmissions(submissions));
  }
}

function* initialFetchData() {
  const { pairs, contests, problems, problemModels } = yield all({
    pairs: call(fetchContestProblemPairs),
    contests: call(fetchContests),
    problems: call(fetchProblems),
    problemModels: call(fetchProblemModels)
  });
  yield put(receiveInitialData(contests, problems, pairs, problemModels));
}

function* fetchMergedProblemsOnce() {
  yield take(REQUEST_MERGED_PROBLEMS);
  const problems = yield call(fetchMergedProblems);
  yield put(receiveMergedProblems(problems));
}

function* fetchStreakRankingOnce() {
  yield take(REQUEST_STREAK_RANKING);
  const ranking = yield call(fetchStreaks);
  yield put(receiveStreakRanking(ranking));
}

function* requestAndReceiveUserInfo(action: Action) {
  if (action.type === UPDATE_USER_IDS) {
    const { userId } = action;
    const userInfo = yield call(fetchUserInfo, userId);
    yield put(receiveUserInfo(userInfo));
  }
}

function* requestAndReceiveUserContestHistory(action: Action) {
  if (action.type === UPDATE_USER_IDS) {
    const { userId } = action;
    const contestHistory = yield call(fetchContestHistory, userId);
    yield put(receiveUserContestHistory(contestHistory));
  }
}

function* rootSaga() {
  yield all([
    call(initialFetchData),
    takeLatest(UPDATE_USER_IDS, requestAndReceiveSubmissions),
    takeLatest(UPDATE_USER_IDS, requestAndReceiveUserInfo),
    takeLatest(UPDATE_USER_IDS, requestAndReceiveUserContestHistory),
    call(fetchMergedProblemsOnce),
    call(fetchStreakRankingOnce)
  ]);
}

export default rootSaga;

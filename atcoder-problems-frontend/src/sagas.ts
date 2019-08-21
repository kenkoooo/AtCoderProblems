import { all, call, put, takeLatest, take } from "redux-saga/effects";
import Action, {
  receiveAcRanking,
  receiveInitialData,
  receiveLangRanking,
  receiveMergedProblems,
  receiveProblemModels,
  receiveSubmissions,
  receiveSumRanking,
  receiveUserContestHistory,
  receiveUserInfo,
  REQUEST_AC_RANKING,
  REQUEST_LANG_RANKING,
  REQUEST_MERGED_PROBLEMS,
  REQUEST_PROBLEM_MODELS,
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
  fetchUserInfo
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
      (submissions, list) => submissions.concat(list),
      List<Submission>()
    );
    yield put(receiveSubmissions(submissions));
  }
}

function* initialFetchData() {
  const { pairs, contests, problems } = yield all({
    pairs: call(fetchContestProblemPairs),
    contests: call(fetchContests),
    problems: call(fetchProblems)
  });
  yield put(receiveInitialData(contests, problems, pairs));
}

function* fetchMergedProblemsOnce() {
  yield take(REQUEST_MERGED_PROBLEMS);
  const problems = yield call(fetchMergedProblems);
  yield put(receiveMergedProblems(problems));
}

function* fetchAcRankingOnce() {
  yield take(REQUEST_AC_RANKING);
  const ranking = yield call(fetchACRanking);
  yield put(receiveAcRanking(ranking));
}

function* fetchSumRankingOnce() {
  yield take(REQUEST_SUM_RANKING);
  const ranking = yield call(fetchSumRanking);
  yield put(receiveSumRanking(ranking));
}

function* fetchLangRankingOnce() {
  yield take(REQUEST_LANG_RANKING);
  const ranking = yield call(fetchLangRanking);
  yield put(receiveLangRanking(ranking));
}

function* fetchProblemModelOnce() {
  yield take(REQUEST_PROBLEM_MODELS);
  const problemModels = yield call(fetchProblemModels);
  yield put(receiveProblemModels(problemModels));
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
    call(fetchAcRankingOnce),
    call(fetchSumRankingOnce),
    call(fetchLangRankingOnce),
    call(fetchProblemModelOnce)
  ]);
}

export default rootSaga;

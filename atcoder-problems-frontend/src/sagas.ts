import { all, call, put, takeLatest, take } from "redux-saga/effects";
import Action, {
  clearSubmissions,
  receiveAcRanking,
  receiveInitialData,
  receiveMergedProblems,
  receivePerf,
  receiveSubmissions,
  receiveSumRanking,
  receiveUserInfo,
  REQUEST_AC_RANKING,
  REQUEST_MERGED_PROBLEMS,
  REQUEST_PERF,
  REQUEST_SUM_RANKING,
  UPDATE_USER_IDS
} from "./actions";
import {
  fetchACRanking,
  fetchContestProblemPairs,
  fetchContests,
  fetchMergedProblems,
  fetchProblemPerformances,
  fetchProblems,
  fetchSubmissions,
  fetchSumRanking,
  fetchUserInfo
} from "./utils/Api";

function* requestAndReceiveSubmissions(action: Action) {
  if (action.type === UPDATE_USER_IDS) {
    yield put(clearSubmissions());
    const { userId, rivals } = action;
    yield all(
      rivals
        .push(userId)
        .toArray()
        .map(id =>
          call(function*() {
            const submissions = yield call(fetchSubmissions, id);
            yield put(receiveSubmissions(submissions));
          })
        )
    );
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

function* fetchPerformancesOnce() {
  yield take(REQUEST_PERF);
  const perf = yield call(fetchProblemPerformances);
  yield put(receivePerf(perf));
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

function* requestAndReceiveUserInfo(action: Action) {
  if (action.type === UPDATE_USER_IDS) {
    const { userId } = action;
    const userInfo = yield call(fetchUserInfo, userId);
    yield put(receiveUserInfo(userInfo));
  }
}

function* rootSaga() {
  yield all([
    call(initialFetchData),
    takeLatest(UPDATE_USER_IDS, requestAndReceiveSubmissions),
    takeLatest(UPDATE_USER_IDS, requestAndReceiveUserInfo),
    call(fetchMergedProblemsOnce),
    call(fetchPerformancesOnce),
    call(fetchAcRankingOnce),
    call(fetchSumRankingOnce)
  ]);
}

export default rootSaga;

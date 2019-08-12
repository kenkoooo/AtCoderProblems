import { all, call, put, takeLatest, take } from "redux-saga/effects";
import Action, {
  clearSubmissions,
  receiveContestProblemPair,
  receiveContests,
  receiveMergedProblems,
  receivePerf,
  receiveProblems,
  receiveSubmissions,
  receiveUserInfo,
  REQUEST_CONTEST_PROBLEM_PAIR,
  REQUEST_CONTESTS,
  REQUEST_MERGED_PROBLEMS,
  REQUEST_PERF,
  REQUEST_PROBLEMS,
  UPDATE_USER_IDS
} from "./actions";
import {
  fetchContestProblemPairs,
  fetchContests,
  fetchMergedProblems,
  fetchProblemPerformances,
  fetchProblems,
  fetchSubmissions,
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
        .map(userId =>
          call(function* () {
            const submissions = yield call(fetchSubmissions, userId);
            yield put(receiveSubmissions(submissions));
          })
        )
    );
  }
}

function* fetchContestProblemPairOnce() {
  yield take(REQUEST_CONTEST_PROBLEM_PAIR);
  const pairs = yield call(fetchContestProblemPairs);
  yield put(receiveContestProblemPair(pairs));
}

function* fetchContestsOnce() {
  yield take(REQUEST_CONTESTS);
  const contests = yield call(fetchContests);
  yield put(receiveContests(contests));
}

function* fetchProblemsOnce() {
  yield take(REQUEST_PROBLEMS);
  const problems = yield call(fetchProblems);
  yield put(receiveProblems(problems));
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

function* requestAndReceiveUserInfo(action: Action) {
  if (action.type === UPDATE_USER_IDS) {
    const { userId } = action;
    const userInfo = yield call(fetchUserInfo, userId);
    yield put(receiveUserInfo(userInfo));
  }
}

function* rootSaga() {
  yield all([
    takeLatest(UPDATE_USER_IDS, requestAndReceiveSubmissions),
    takeLatest(UPDATE_USER_IDS, requestAndReceiveUserInfo),
    call(fetchContestProblemPairOnce),
    call(fetchContestsOnce),
    call(fetchProblemsOnce),
    call(fetchMergedProblemsOnce),
    call(fetchPerformancesOnce)
  ]);
}

export default rootSaga;

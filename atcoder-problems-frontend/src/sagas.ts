import { all, call, put, takeLatest, take } from "redux-saga/effects";
import Action, {
  clearSubmissions,
  receiveInitialData,
  receiveMergedProblems,
  receivePerf,
  receiveSubmissions,
  receiveUserInfo,
  REQUEST_MERGED_PROBLEMS,
  REQUEST_PERF,
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
    call(fetchPerformancesOnce)
  ]);
}

export default rootSaga;

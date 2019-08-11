import { all, call, put, takeLatest, take } from "redux-saga/effects";
import Action, {
  clearSubmissions,
  receiveContestProblemPair,
  receiveContests,
  receiveProblems,
  receiveSubmissions,
  REQUEST_CONTEST_PROBLEM_PAIR,
  REQUEST_CONTESTS,
  REQUEST_PROBLEMS,
  UPDATE_USER_IDS
} from "./actions";
import {
  fetchContestProblemPairs,
  fetchContests,
  fetchProblems,
  fetchSubmissions
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
          call(function*() {
            const submissions = yield call(fetchSubmissions, userId);
            yield put(receiveSubmissions(submissions));
          })
        )
    );
  }
}

function* requestAndReceiveContestProblemPairOnce() {
  yield take(REQUEST_CONTEST_PROBLEM_PAIR);
  const pairs = yield call(fetchContestProblemPairs);
  yield put(receiveContestProblemPair(pairs));
}

function* requestAndReceiveContestsOnce() {
  yield take(REQUEST_CONTESTS);
  const contests = yield call(fetchContests);
  yield put(receiveContests(contests));
}

function* requestAndReceiveProblemsOnce() {
  yield take(REQUEST_PROBLEMS);
  const problems = yield call(fetchProblems);
  yield put(receiveProblems(problems));
}

function* rootSaga() {
  yield all([
    takeLatest(UPDATE_USER_IDS, requestAndReceiveSubmissions),
    requestAndReceiveContestProblemPairOnce,
    requestAndReceiveContestsOnce,
    requestAndReceiveProblemsOnce
  ]);
}

export default rootSaga;

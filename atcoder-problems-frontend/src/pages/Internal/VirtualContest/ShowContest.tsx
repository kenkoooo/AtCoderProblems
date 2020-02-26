import React, { useEffect, useState } from "react";
import { useParams, useHistory, Redirect, NavLink } from "react-router-dom";
import { connect, PromiseState } from "react-refetch";
import {
  Button,
  Row,
  Table,
  Col,
  Spinner,
  Alert,
  ButtonGroup
} from "reactstrap";
import * as CachedApi from "../../../utils/CachedApiClient";
import { List, Map } from "immutable";
import { ProblemId } from "../../../interfaces/Status";
import { CONTEST_JOIN, contestGetUrl, USER_GET } from "../ApiUrl";
import Submission from "../../../interfaces/Submission";
import MergedProblem from "../../../interfaces/MergedProblem";
import { fetchVirtualContestSubmission } from "../../../utils/CachedApiClient";
import ProblemModel, {
  isProblemModelWithDifficultyModel
} from "../../../interfaces/ProblemModel";
import { predictSolveProbability } from "../../../utils/ProblemModelUtil";
import {
  clipDifficulty,
  getRatingColorClass,
  isAccepted
} from "../../../utils";
import { formatMomentDateTime, parseSecond } from "../../../utils/DateUtil";
import {
  formatMode,
  UserResponse,
  VirtualContest,
  VirtualContestItem
} from "../types";
import { compareProblem } from "./util";
import ProblemLink from "../../../components/ProblemLink";
import TweetButton from "../../../components/TweetButton";
import { GITHUB_LOGIN_LINK } from "../../../utils/Url";

interface ShowingVirtualContest extends VirtualContest {
  map: Map<ProblemId, List<Submission>> | undefined;
}

interface OuterProps {
  contestId: string;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<ShowingVirtualContest>;
  userInfoGet: PromiseState<UserResponse | null>;
  joinContest: () => void;
  joinContestPost: PromiseState<{} | null>;
  problemMapFetch: PromiseState<Map<ProblemId, MergedProblem>>;
  problemModelGet: PromiseState<Map<ProblemId, ProblemModel>>;
}

const InnerShowContest = (props: InnerProps) => {
  const history = useHistory();
  const {
    contestInfoFetch,
    userInfoGet,
    problemMapFetch,
    problemModelGet
  } = props;

  if (contestInfoFetch.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (contestInfoFetch.rejected) {
    return <Alert color="danger">Failed to fetch contest info.</Alert>;
  }

  const problemMap = problemMapFetch.fulfilled
    ? problemMapFetch.value
    : Map<ProblemId, MergedProblem>();
  const contestInfo = contestInfoFetch.value;
  const rawAtCoderUserId =
    userInfoGet.fulfilled && userInfoGet.value
      ? userInfoGet.value.atcoder_user_id
      : null;
  const internalUserId =
    userInfoGet.fulfilled && userInfoGet.value
      ? userInfoGet.value.internal_user_id
      : null;
  const submissionMap = contestInfo.map
    ? contestInfo.map
    : Map<ProblemId, List<Submission>>();
  const modelMap = problemModelGet.fulfilled
    ? problemModelGet.value
    : Map<ProblemId, ProblemModel>();

  const atCoderUserId = rawAtCoderUserId ? rawAtCoderUserId : "";
  const isLoggedIn = internalUserId !== null;
  const userIdIsSet = atCoderUserId !== "";

  const start = contestInfo.start_epoch_second;
  const end = contestInfo.start_epoch_second + contestInfo.duration_second;
  const alreadyJoined =
    userIdIsSet && contestInfo.participants.includes(atCoderUserId);
  const now = Math.floor(Date.now() / 1000);
  const canJoin = !alreadyJoined && userIdIsSet && now < end;
  const isOwner = contestInfo.owner_user_id === internalUserId;
  const problems = contestInfo.problems;

  const contestResults = contestInfo.participants
    .map(userId => {
      const problemResults = problems.map(problem => {
        if (contestInfo.mode === "lockout") {
          return calcLockout(problem, submissionMap, userId, start, end);
        } else {
          return calcNormal(problem, submissionMap, userId, start, end);
        }
      });

      const solvedData = problemResults
        .sort((a, b) => a.maxPointSubmissionTime - b.maxPointSubmissionTime)
        .reduce(
          ({ list, prev }, a) => {
            const problemId = a.id;
            const time = a.maxPointSubmissionTime - prev;
            const solved = a.maxPoint !== 0;
            return {
              list: list.push({ problemId, time, solved }),
              prev: a.maxPointSubmissionTime
            };
          },
          {
            list: List<{ problemId: string; time: number; solved: boolean }>(),
            prev: start
          }
        ).list;

      const totalResult = problemResults.reduce(
        (result, e) => {
          return {
            wrongAnswers: result.wrongAnswers + e.trialsBeforeMax,
            pointSum: result.pointSum + e.maxPoint,
            lastIncreaseTime: Math.max(
              result.lastIncreaseTime,
              e.maxPointSubmissionTime
            )
          };
        },
        {
          wrongAnswers: 0,
          pointSum: 0,
          lastIncreaseTime: 0
        }
      );
      return {
        totalResult,
        problemResults,
        userId,
        estimatedPerformance: calcPerformance(solvedData, modelMap)
      };
    })
    .sort((a, b) => {
      if (a.totalResult.pointSum !== b.totalResult.pointSum) {
        return b.totalResult.pointSum - a.totalResult.pointSum;
      }
      if (a.totalResult.lastIncreaseTime !== b.totalResult.lastIncreaseTime) {
        return a.totalResult.lastIncreaseTime - b.totalResult.lastIncreaseTime;
      }
      return a.totalResult.wrongAnswers - b.totalResult.wrongAnswers;
    });
  const showProblems = start < now;
  return (
    <>
      <Row className="my-2">
        <Col sm="12">
          <h1>{contestInfo.title}</h1>
          <h4>{contestInfo.memo}</h4>
          <h5>Mode: {formatMode(contestInfo.mode)}</h5>
          <h5>
            Time: {formatMomentDateTime(parseSecond(start))} -{" "}
            {formatMomentDateTime(parseSecond(end))} (
            {Math.floor(contestInfo.duration_second / 60)} minutes)
          </h5>
          {start < now && now < end ? (
            <h5>
              Remain: <Timer remain={end - now} />
            </h5>
          ) : null}
          {!isLoggedIn ? (
            <Alert color="warning">
              Please <a href={GITHUB_LOGIN_LINK}>Login</a> before you join the
              contest.
            </Alert>
          ) : !userIdIsSet ? (
            <Alert color="warning">
              Please set the AtCoder ID from{" "}
              <NavLink to="/login/user">here</NavLink>, before you join the
              contest.
            </Alert>
          ) : null}
          <ButtonGroup>
            {canJoin ? (
              <Button onClick={() => props.joinContest()}>Join</Button>
            ) : null}
            {isOwner ? (
              <Button
                onClick={() =>
                  history.push({
                    pathname: `/contest/update/${contestInfo.id}`
                  })
                }
              >
                Edit
              </Button>
            ) : null}
            <TweetButton title={contestInfo.title} id={contestInfo.id} />
          </ButtonGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col sm="12">
          <Table striped>
            <thead>
              <tr>
                <th>Participant</th>
                {showProblems
                  ? problems.sort(compareProblem).map(p => {
                      const problemId = p.id;
                      const problem = problemMap.get(problemId, null);
                      return (
                        <th key={problemId}>
                          {problem ? (
                            <ProblemLink
                              problemId={problem.id}
                              contestId={problem.contest_id}
                              problemTitle={problem.title}
                            />
                          ) : (
                            problemId
                          )}
                          {p.point !== null ? ` (${p.point})` : null}
                        </th>
                      );
                    })
                  : null}
                <th style={{ textAlign: "center" }}>Score</th>
                {contestInfo.mode !== "lockout" ? (
                  <th style={{ textAlign: "center" }}>Estimated Performance</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {contestResults.map(
                ({
                  userId,
                  problemResults,
                  totalResult,
                  estimatedPerformance
                }) => (
                  <tr key={userId}>
                    <th>{userId}</th>
                    {showProblems
                      ? problemResults.sort(compareProblem).map(result => {
                          if (result.submissionCount === 0) {
                            return (
                              <td
                                key={result.id}
                                style={{ textAlign: "center" }}
                              >
                                -
                              </td>
                            );
                          }

                          const trials =
                            result.maxPoint === 0
                              ? result.submissionCount
                              : result.trialsBeforeMax;
                          return (
                            <td key={result.id}>
                              <ScoreCell
                                maxPoint={result.maxPoint}
                                trials={trials}
                                time={result.maxPointSubmissionTime}
                              />
                            </td>
                          );
                        })
                      : null}
                    <td>
                      <ScoreCell
                        maxPoint={totalResult.pointSum}
                        trials={totalResult.wrongAnswers}
                        time={totalResult.lastIncreaseTime}
                      />
                    </td>

                    {contestInfo.mode !== "lockout" ? (
                      <td>
                        <p
                          className={getRatingColorClass(estimatedPerformance)}
                          style={{ textAlign: "center", fontWeight: "bold" }}
                        >
                          {estimatedPerformance}
                        </p>
                      </td>
                    ) : null}
                  </tr>
                )
              )}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
};

const ShowContest = connect<OuterProps, InnerProps>((props: OuterProps) => {
  return {
    problemModelGet: {
      comparison: null,
      value: () => CachedApi.cachedProblemModels()
    },
    userInfoGet: {
      url: USER_GET
    },
    contestInfoFetch: {
      url: contestGetUrl(props.contestId),
      then: contest => {
        const start = contest.start_epoch_second;
        const end = contest.start_epoch_second + contest.duration_second;
        const users = contest.participants;
        const problems = contest.problems.map(
          (item: VirtualContestItem) => item.id
        );
        return {
          value: fetchSubmissions(start, end, users, problems).then(map => ({
            map,
            ...contest
          }))
        };
      }
    },
    problemMapFetch: {
      comparison: null,
      value: () => CachedApi.cachedMergedProblemMap()
    },
    joinContest: () => ({
      joinContestPost: {
        url: CONTEST_JOIN,
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contest_id: props.contestId }),
        andThen: () => ({
          contestInfoFetch: {
            url: contestGetUrl(props.contestId),
            force: true,
            refreshing: true
          }
        })
      }
    }),
    joinContestPost: { value: null }
  };
})(InnerShowContest);

const ScoreCell = (props: {
  maxPoint: number;
  trials: number;
  time: number;
}) => (
  <>
    <p style={{ textAlign: "center" }}>
      <span style={{ color: "limegreen", fontWeight: "bold" }}>
        {props.maxPoint}
      </span>{" "}
      <span style={{ color: "red" }}>
        {props.trials === 0 ? "" : `(${props.trials})`}
      </span>
    </p>
    <p style={{ textAlign: "center" }}>
      <span style={{ color: "gray" }}>
        {props.maxPoint === 0 ? "-" : formatDuration(props.time)}
      </span>
    </p>
  </>
);

const Timer = (props: { remain: number }) => {
  const [timeLeft, setTimeLeft] = useState(props.remain);
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);
  if (timeLeft <= 0) {
    return null;
  }
  return <span>{formatDuration(timeLeft)}</span>;
};

const calcPerformance = (
  solvedData: List<{ problemId: string; time: number; solved: boolean }>,
  modelMap: Map<ProblemId, ProblemModel>
) => {
  let internalRating = 0;
  let probability = 0.0;
  for (let candidateRating = -4000; candidateRating < 4000; candidateRating++) {
    const p = solvedData
      .map(({ problemId, time, solved }) => {
        const model = modelMap.get(problemId);
        return calcProbability(model, candidateRating, time, solved);
      })
      .reduce((prev, cur) => (cur ? prev * cur : prev), 1.0);
    if (probability < p) {
      probability = p;
      internalRating = candidateRating;
    }
  }

  return clipDifficulty(internalRating);
};

const calcProbability = (
  model: ProblemModel | undefined,
  rating: number,
  time: number,
  solved: boolean
) => {
  const slope = model?.slope;
  const intercept = model?.intercept;
  const v = model?.variance;
  if (isProblemModelWithDifficultyModel(model) && slope && intercept && v) {
    const pSolved = predictSolveProbability(model, rating);
    if (!solved) {
      return 1.0 - pSolved;
    }

    const logTime = Math.log(time);
    const mean = slope * rating + intercept;
    const d = logTime - mean;
    const pTime =
      Math.exp((-d * d) / (2 * v * v)) / Math.sqrt(2 * Math.PI * v * v);
    return pSolved * pTime;
  } else {
    return undefined;
  }
};

const formatDuration = (durationSecond: number) => {
  const hours = Math.floor(durationSecond / 3600);
  const minutes = Math.floor(durationSecond / 60) - hours * 60;
  const seconds = durationSecond - hours * 3600 - minutes * 60;

  const mm = minutes < 10 ? "0" + minutes : "" + minutes;
  const ss = seconds < 10 ? "0" + seconds : "" + seconds;
  return `${hours}:${mm}:${ss}`;
};

const fetchSubmissions = async (
  start: number,
  end: number,
  users: string[],
  problems: string[]
) => {
  const result = await fetchVirtualContestSubmission(
    users,
    problems,
    start,
    end
  );
  return result.reduce((map, s) => {
    const list = map.get(s.problem_id, List<Submission>());
    return map.set(s.problem_id, list.push(s));
  }, Map<ProblemId, List<Submission>>());
};

const calcNormal = (
  problem: VirtualContestItem,
  submissionMap: Map<ProblemId, List<Submission>>,
  userId: string,
  start: number,
  end: number
) => {
  const submissions = submissionMap
    .get(problem.id, List<Submission>())
    .filter(s => s.user_id === userId)
    .filter(s => start <= s.epoch_second && s.epoch_second <= end)
    .sortBy(s => s.id);
  const result = submissions.reduce(
    (cur, submission, i) => {
      const point =
        isAccepted(submission.result) && problem.point !== null
          ? problem.point
          : submission.point;

      if (cur.maxPoint < point) {
        return {
          maxPoint: point,
          maxPointSubmissionTime: submission.epoch_second - start,
          trialsBeforeMax: i
        };
      } else {
        return cur;
      }
    },
    {
      maxPoint: 0,
      maxPointSubmissionTime: 0,
      trialsBeforeMax: 0
    }
  );
  return {
    order: problem.order,
    id: problem.id,
    submissionCount: submissions.size,
    ...result
  };
};

const calcLockout = (
  problem: VirtualContestItem,
  submissionMap: Map<ProblemId, List<Submission>>,
  userId: string,
  start: number,
  end: number
) => {
  const acSubmissions = submissionMap
    .get(problem.id, List<Submission>())
    .filter(s => start <= s.epoch_second && s.epoch_second <= end)
    .filter(s => isAccepted(s.result))
    .sortBy(s => s.id);
  const firstAc = acSubmissions.get(0);
  if (firstAc && firstAc.user_id === userId) {
    return {
      order: problem.order,
      id: problem.id,
      submissionCount: 1,
      maxPoint: problem.point !== null ? problem.point : firstAc.point,
      maxPointSubmissionTime: firstAc.epoch_second - start,
      trialsBeforeMax: 0
    };
  } else {
    return {
      order: problem.order,
      id: problem.id,
      submissionCount: 0,
      maxPoint: 0,
      maxPointSubmissionTime: 0,
      trialsBeforeMax: 0
    };
  }
};

export default () => {
  const { contestId } = useParams();
  if (contestId) {
    return <ShowContest contestId={contestId} />;
  } else {
    return <Redirect to="/contest/recent" />;
  }
};

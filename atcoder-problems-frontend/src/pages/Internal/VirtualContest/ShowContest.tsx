import React from "react";
import { useParams, useHistory, Redirect } from "react-router-dom";
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
import { List, Map, Set } from "immutable";
import { ProblemId } from "../../../interfaces/Status";
import { formatProblemUrl } from "../../../utils/Url";
import { CONTEST_JOIN, contestGetUrl, USER_GET } from "../ApiUrl";
import Submission from "../../../interfaces/Submission";
import MergedProblem from "../../../interfaces/MergedProblem";
import { fetchSubmissionsFrom } from "../../../utils/CachedApiClient";
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
        return {
          value: fetchSubmissions(start, end, users).then(map => ({
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
})((props: InnerProps) => {
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
  const atcoderUserId =
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
  const start = contestInfo.start_epoch_second;
  const end = contestInfo.start_epoch_second + contestInfo.duration_second;
  const alreadyJoined =
    atcoderUserId != null && contestInfo.participants.includes(atcoderUserId);
  const now = Math.floor(Date.now() / 1000);
  const canJoin = !alreadyJoined && atcoderUserId !== null && now < end;
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

  return (
    <>
      <Row className="my-2">
        <Col sm="12">
          <h1>{contestInfo.title}</h1>
          <h4>{contestInfo.memo}</h4>
          <h5>Mode: {formatMode(contestInfo.mode)}</h5>
          <h5>
            Time:
            {formatMomentDateTime(parseSecond(start))} -{" "}
            {formatMomentDateTime(parseSecond(end))}
          </h5>
          {atcoderUserId === null ? (
            <Alert color="warning">
              Please set the AtCoder ID, before you join the contest.
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
          </ButtonGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col sm="12">
          <Table striped>
            <thead>
              <tr>
                <th>Participant</th>
                {problems.sort(compareProblem).map(p => {
                  const problemId = p.id;
                  const problem = problemMap.get(problemId, null);
                  return (
                    <th key={problemId}>
                      {problem ? (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          href={formatProblemUrl(
                            problem.id,
                            problem.contest_id
                          )}
                        >
                          {problem.title}
                        </a>
                      ) : (
                        problemId
                      )}
                      {contestInfo.mode === "lockout" && p.point !== null
                        ? ` (${p.point})`
                        : null}
                    </th>
                  );
                })}
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
                    {problemResults.sort(compareProblem).map(result => {
                      if (result.submissionCount === 0) {
                        return (
                          <td key={result.id} style={{ textAlign: "center" }}>
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
                    })}
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
});

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
  users: string[]
) => {
  let result = List<Submission>();
  const submissionsArray = await Promise.all(
    users.map(user =>
      CachedApi.cachedSubmissions(user).catch(() => List<Submission>())
    )
  );
  submissionsArray.forEach(submissions => {
    result = result.concat(submissions);
  });

  let cur = Math.max(Math.floor(Date.now() / 1000) - 600, start);
  let fetchCount = 0;
  while (cur <= end) {
    const submissions = await fetchSubmissionsFrom(cur).catch(() =>
      List<Submission>()
    );
    fetchCount += 1;
    result = result.concat(submissions);
    const maxSecond = submissions.map(s => s.epoch_second).max();
    if (!maxSecond || maxSecond > end || fetchCount > 15) {
      break;
    }
    cur = maxSecond + 1;
  }

  result = result
    .filter(s => start <= s.epoch_second && s.epoch_second < end)
    .reduce(
      ({ set, list }, s) => {
        if (set.contains(s.id)) {
          return { set, list };
        } else {
          return { set: set.add(s.id), list: list.push(s) };
        }
      },
      {
        set: Set<number>(),
        list: List<Submission>()
      }
    ).list;

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
      if (cur.maxPoint < submission.point) {
        return {
          maxPoint: submission.point,
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

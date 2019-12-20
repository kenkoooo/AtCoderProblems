import React from "react";
import { useParams, useHistory, Redirect } from "react-router-dom";
import { connect, PromiseState } from "react-refetch";
import { VirtualContest } from "./types";
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
import { formatProblemUrl } from "../../../utils/Url";
import { CONTEST_JOIN, contestGetUrl, USER_GET } from "../ApiUrl";
import Submission from "../../../interfaces/Submission";
import MergedProblem from "../../../interfaces/MergedProblem";
import { fetchSubmissionsFrom } from "../../../utils/CachedApiClient";
import ProblemModel, {
  isProblemModelWithDifficultyModel
} from "../../../interfaces/ProblemModel";
import { predictSolveProbability } from "../../../utils/ProblemModelUtil";
import { clipDifficulty } from "../../../utils";

interface ShowingVirtualContest extends VirtualContest {
  map: Map<ProblemId, List<Submission>> | undefined;
}

interface UserInfo {
  internal_user_id: string;
  atcoder_user_id: string;
}

interface OuterProps {
  contestId: string;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<ShowingVirtualContest>;
  userInfoGet: PromiseState<UserInfo>;
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
        return {
          value: fetchSubmissions(start, end).then(map => ({
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
  const atcoderUserId = userInfoGet.fulfilled
    ? userInfoGet.value.atcoder_user_id
    : null;
  const internalUserId = userInfoGet.fulfilled
    ? userInfoGet.value.internal_user_id
    : null;
  const submissionMap = contestInfo.map
    ? contestInfo.map
    : Map<ProblemId, List<Submission>>();
  const modelMap = problemModelGet.fulfilled
    ? problemModelGet.value
    : Map<ProblemId, ProblemModel>();
  const alreadyJoined =
    atcoderUserId != null && contestInfo.participants.includes(atcoderUserId);
  const isOwner = contestInfo.owner_user_id === internalUserId;
  const start = contestInfo.start_epoch_second;
  const end = contestInfo.start_epoch_second + contestInfo.duration_second;
  const problemIds = contestInfo.problems.sort();

  const contestResults = contestInfo.participants
    .map(userId => {
      const problemResults = problemIds.map(problemId => {
        const submissions = submissionMap
          .get(problemId, List<Submission>())
          .filter(s => s.user_id === userId)
          .filter(s => start <= s.epoch_second && s.epoch_second <= end)
          .sortBy(s => s.id);
        const result = submissions.reduce(
          (cur, submission, i) => {
            if (cur.maxPoint < submission.point) {
              return {
                maxPoint: submission.point,
                maxPointSubmissionTime: submission.epoch_second,
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
          problemId,
          submissionCount: submissions.size,
          ...result
        };
      });

      const solvedData = problemResults
        .sort((a, b) => a.maxPointSubmissionTime - b.maxPointSubmissionTime)
        .reduce(
          ({ list, prev }, a) => {
            const problemId = a.problemId;
            const time = a.maxPointSubmissionTime - prev;
            return {
              list: list.push({ problemId, time }),
              prev: a.maxPointSubmissionTime
            };
          },
          { list: List<{ problemId: string; time: number }>(), prev: start }
        ).list;

      const estimatedPerformance = calcPerformance(solvedData, modelMap);

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
      return { totalResult, problemResults, userId, estimatedPerformance };
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
          <ButtonGroup>
            {!alreadyJoined && atcoderUserId !== null ? (
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
                {problemIds.map(problemId => {
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
                    </th>
                  );
                })}
                <th>Score</th>
                <th>Estimated Performance</th>
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
                    {problemResults.map(result => {
                      if (result.submissionCount === 0) {
                        return <td key={result.problemId}>-</td>;
                      }

                      const trials =
                        result.maxPoint === 0
                          ? result.submissionCount
                          : result.trialsBeforeMax;

                      return (
                        <td key={result.problemId}>
                          <p>{result.maxPoint}</p>
                          <p>{trials === 0 ? "" : `(${trials})`}</p>
                          <p>
                            {result.maxPoint === 0
                              ? ""
                              : formatDuration(
                                  result.maxPointSubmissionTime - start
                                )}
                          </p>
                        </td>
                      );
                    })}
                    <td>
                      <p>{totalResult.pointSum}</p>
                      <p>
                        {totalResult.wrongAnswers === 0
                          ? ""
                          : `(${totalResult.wrongAnswers})`}
                      </p>
                      <p>
                        {totalResult.pointSum === 0
                          ? ""
                          : formatDuration(
                              totalResult.lastIncreaseTime - start
                            )}
                      </p>
                    </td>
                    <td>{estimatedPerformance}</td>
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

const calcPerformance = (
  solvedData: List<{ problemId: string; time: number }>,
  modelMap: Map<ProblemId, ProblemModel>
) => {
  let internalRating = 0;
  let probability = 0.0;
  for (let candidateRating = 0; candidateRating < 6000; candidateRating++) {
    const p = solvedData
      .map(({ problemId, time }) => {
        const model = modelMap.get(problemId);
        const slope = model?.slope;
        const intercept = model?.intercept;
        const variance = model?.variance;

        if (
          isProblemModelWithDifficultyModel(model) &&
          slope &&
          intercept &&
          variance
        ) {
          const pSolved = predictSolveProbability(model, candidateRating);

          const logTime = Math.log(time);
          const mean = slope * candidateRating + intercept;
          const diff = logTime - mean;
          const pTime =
            Math.exp(((-diff * diff) / variance) * variance) / variance;

          return pSolved * pTime;
        } else {
          return undefined;
        }
      })
      .reduce((cur, p) => (p ? cur * p : cur), 0.0);
    if (probability < p) {
      probability = p;
      internalRating = candidateRating;
    }
  }

  return clipDifficulty(internalRating);
};

const formatDuration = (durationSecond: number) => {
  const hours = Math.floor(durationSecond / 3600);
  const minutes = Math.floor(durationSecond / 60) - hours * 60;
  const seconds = durationSecond - hours * 3600 - minutes * 60;

  const mm = minutes < 10 ? "0" + minutes : "" + minutes;
  const ss = seconds < 10 ? "0" + seconds : "" + seconds;
  return `${hours}:${mm}:${ss}`;
};

const fetchSubmissions = async (start: number, end: number) => {
  let cur = start;
  let result = List<Submission>();
  while (cur <= end) {
    const submissions = await fetchSubmissionsFrom(cur);
    result = result.concat(submissions);
    const maxSecond = submissions.map(s => s.epoch_second).max();
    if (!maxSecond || maxSecond > end) {
      break;
    }
    cur = maxSecond + 1;
  }
  return result.reduce((map, s) => {
    const list = map.get(s.problem_id, List<Submission>());
    return map.set(s.problem_id, list.push(s));
  }, Map<ProblemId, List<Submission>>());
};

export default () => {
  const { contestId } = useParams();
  if (contestId) {
    return <ShowContest contestId={contestId} />;
  } else {
    return <Redirect to="/contest/recent" />;
  }
};

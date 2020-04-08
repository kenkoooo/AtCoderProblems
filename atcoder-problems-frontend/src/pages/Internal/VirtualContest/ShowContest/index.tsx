import React from "react";
import { NavLink, Redirect, useHistory, useParams } from "react-router-dom";
import { connect, PromiseState } from "react-refetch";
import { Alert, Button, ButtonGroup, Col, Row, Spinner } from "reactstrap";
import * as CachedApi from "../../../../utils/CachedApiClient";
import { fetchVirtualContestSubmission } from "../../../../utils/CachedApiClient";
import { List, Map as ImmutableMap } from "immutable";
import { ProblemId } from "../../../../interfaces/Status";
import { CONTEST_JOIN, contestGetUrl, USER_GET } from "../../ApiUrl";
import Submission from "../../../../interfaces/Submission";
import MergedProblem from "../../../../interfaces/MergedProblem";
import ProblemModel from "../../../../interfaces/ProblemModel";
import { isAccepted } from "../../../../utils";
import {
  formatMomentDateTimeDay,
  parseSecond
} from "../../../../utils/DateUtil";
import {
  formatMode,
  UserResponse,
  VirtualContest,
  VirtualContestItem
} from "../../types";
import TweetButton from "../../../../components/TweetButton";
import { GITHUB_LOGIN_LINK } from "../../../../utils/Url";
import {
  BestSubmissionEntry,
  calcPerformance,
  extractBestSubmissions
} from "./util";
import ContestTable from "./ContestTable";
import Timer from "../../../../components/Timer";

interface ShowingVirtualContest extends VirtualContest {
  map: ImmutableMap<ProblemId, List<Submission>> | undefined;
}

interface OuterProps {
  contestId: string;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<ShowingVirtualContest>;
  userInfoGet: PromiseState<UserResponse | null>;
  joinContest: () => void;
  joinContestPost: PromiseState<{} | null>;
  problemMapFetch: PromiseState<ImmutableMap<ProblemId, MergedProblem>>;
  problemModelGet: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
}

function getEstimatedPerformances(
  contestInfo: ShowingVirtualContest,
  bestSubmissions: BestSubmissionEntry[],
  start: number,
  problems: VirtualContestItem[],
  modelMap: ImmutableMap<ProblemId, ProblemModel>
) {
  return contestInfo.participants.map(userId => {
    const onlySolvedData = bestSubmissions
      .filter(b => b.userId === userId)
      .filter(b => {
        const result = b.bestSubmissionInfo?.bestSubmission.result;
        return result && isAccepted(result);
      })
      .map(b =>
        b.bestSubmissionInfo
          ? {
              time: b.bestSubmissionInfo.bestSubmission.epoch_second,
              id: b.problemId
            }
          : undefined
      )
      .filter((obj): obj is { time: number; id: string } => obj !== undefined)
      .sort((a, b) => a.time - b.time)
      .reduce(
        ({ prev, list }, entry) => ({
          list: list.push({
            problemId: entry.id,
            solved: true,
            time: entry.time - prev
          }),
          prev: entry.time
        }),
        {
          list: List<{ problemId: string; time: number; solved: boolean }>(),
          prev: start
        }
      ).list;
    const solvedData = problems.map(p => {
      const problemId = p.id;
      const entry = onlySolvedData.find(e => e.problemId === problemId);
      return entry ? entry : { problemId: p.id, time: 0, solved: false };
    });
    const performance = calcPerformance(solvedData, modelMap);
    return { performance, userId };
  });
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
    : ImmutableMap<ProblemId, MergedProblem>();
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
    : ImmutableMap<ProblemId, List<Submission>>();
  const modelMap = problemModelGet.fulfilled
    ? problemModelGet.value
    : ImmutableMap<ProblemId, ProblemModel>();

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

  const bestSubmissions = extractBestSubmissions(
    new Map(
      submissionMap
        .entrySeq()
        .map(([problemId, submissions]): [string, Submission[]] => [
          problemId,
          submissions.toArray()
        ])
        .toArray()
    ),
    contestInfo.participants,
    problems.map(item => item.id)
  );

  const enableEstimatedPerformances =
    contestInfo.participants.length * contestInfo.problems.length <= 100;

  const estimatedPerformances = enableEstimatedPerformances
    ? getEstimatedPerformances(
        contestInfo,
        bestSubmissions,
        start,
        problems,
        modelMap
      )
    : [];

  const showProblems = start < now;
  return (
    <>
      <Row className="my-2">
        <Col sm="12">
          <h1>{contestInfo.title}</h1>
          <h4>{contestInfo.memo}</h4>
          <h5>
            Mode: {formatMode(contestInfo.mode)}{" "}
            {enableEstimatedPerformances
              ? null
              : "(Performance estimation is disabled.)"}
          </h5>
          <h5>
            Time: {formatMomentDateTimeDay(parseSecond(start))} -{" "}
            {formatMomentDateTimeDay(parseSecond(end))} (
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
          <ContestTable
            showProblems={showProblems}
            problems={contestInfo.problems.map(item => {
              const problem = problemMap.get(item.id);
              if (problem) {
                return {
                  item,
                  contestId: problem.contest_id,
                  title: problem.title
                };
              } else {
                return { item };
              }
            })}
            mode={contestInfo.mode}
            users={contestInfo.participants}
            bestSubmissions={bestSubmissions}
            estimatedPerformances={estimatedPerformances}
            start={start}
          />
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
  }, ImmutableMap<ProblemId, List<Submission>>());
};

export default () => {
  const { contestId } = useParams();
  if (contestId) {
    return <ShowContest contestId={contestId} />;
  } else {
    return <Redirect to="/contest/recent" />;
  }
};

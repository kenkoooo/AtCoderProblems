import React, { useState, useEffect } from "react";
import { NavLink, Redirect, useHistory, useParams } from "react-router-dom";
import { connect, PromiseState } from "react-refetch";
import {
  Alert,
  Button,
  ButtonGroup,
  Col,
  Row,
  Spinner,
  Table,
} from "reactstrap";
import Octicon, { Check, Sync, Book } from "@primer/octicons-react";
import { Map as ImmutableMap } from "immutable";
import * as CachedApi from "../../../../utils/CachedApiClient";
import { ProblemId } from "../../../../interfaces/Status";
import { CONTEST_JOIN, contestGetUrl, USER_GET } from "../../ApiUrl";
import MergedProblem from "../../../../interfaces/MergedProblem";
import ProblemModel from "../../../../interfaces/ProblemModel";
import {
  formatMomentDateTimeDay,
  parseSecond,
} from "../../../../utils/DateUtil";
import { formatMode, UserResponse, VirtualContest } from "../../types";
import { TweetButton } from "../../../../components/TweetButton";
import { GITHUB_LOGIN_LINK } from "../../../../utils/Url";
import { Timer } from "../../../../components/Timer";
import { ACCOUNT_INFO } from "../../../../utils/RouterPath";
import { ContestTable } from "./ContestTable";
import { LockoutContestTable } from "./LockoutContestTable";

interface OuterProps {
  contestId: string;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<VirtualContest>;
  userInfoGet: PromiseState<UserResponse | null>;
  joinContest: () => void;
  joinContestPost: PromiseState<{} | null>;
  problemMapFetch: PromiseState<ImmutableMap<ProblemId, MergedProblem>>;
  problemModelGet: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
}

const InnerShowContest: React.FC<InnerProps> = (props) => {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const history = useHistory();
  const { contestInfoFetch, userInfoGet, problemMapFetch } = props;

  const [contestTableCondensed, setProblemTableCondensed] = useState(false);
  useEffect(() => {
    if (
      contestInfoFetch.fulfilled &&
      contestInfoFetch.value.problems.length >= 20
    ) {
      setProblemTableCondensed(true);
    }
    // The problems length only needs to be checked once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestInfoFetch.fulfilled]);

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
  const enableEstimatedPerformances =
    contestInfo.participants.length * contestInfo.problems.length <=
    (now < end ? 100 : 500);

  const showProblems = start < now;
  const problems = contestInfo.problems.map((item) => {
    const problem = problemMap.get(item.id);
    if (problem) {
      return {
        item,
        contestId: problem.contest_id,
        title: problem.title,
      };
    } else {
      return { item };
    }
  });

  return (
    <>
      <Row className="my-2">
        <Col sm="12">
          <h1>{contestInfo.title}</h1>
          <h4>{contestInfo.memo}</h4>
        </Col>
      </Row>
      <Row className="my-2">
        <Col>
          <Table>
            <tbody>
              <tr>
                <th>Mode</th>
                <td>
                  {formatMode(contestInfo.mode)}{" "}
                  {enableEstimatedPerformances
                    ? null
                    : "(Performance estimation is disabled)"}
                </td>
              </tr>
              <tr>
                <th>Time</th>
                <td>
                  {formatMomentDateTimeDay(parseSecond(start))} -{" "}
                  {formatMomentDateTimeDay(parseSecond(end))} (
                  {Math.floor(contestInfo.duration_second / 60)} minutes)
                </td>
              </tr>

              {start < now && now < end ? (
                <tr>
                  <th>Remain</th>
                  <td>
                    <Timer remain={end - now} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          {!isLoggedIn ? (
            <Alert color="warning">
              Please <a href={GITHUB_LOGIN_LINK}>Login</a> before you join the
              contest.
            </Alert>
          ) : !userIdIsSet ? (
            <Alert color="warning">
              Please set the AtCoder ID from{" "}
              <NavLink to={ACCOUNT_INFO}>here</NavLink>, before you join the
              contest.
            </Alert>
          ) : null}
          <ButtonGroup>
            {canJoin ? (
              <Button onClick={(): void => props.joinContest()}>Join</Button>
            ) : null}
            {isOwner ? (
              <Button
                onClick={(): void =>
                  history.push({
                    pathname: `/contest/update/${contestInfo.id}`,
                  })
                }
              >
                Edit
              </Button>
            ) : null}
            <TweetButton title={contestInfo.title} id={contestInfo.id} />
          </ButtonGroup>{" "}
          <Button
            outline={!autoRefreshEnabled}
            active={autoRefreshEnabled}
            onClick={(): void => setAutoRefreshEnabled(!autoRefreshEnabled)}
          >
            <Octicon icon={autoRefreshEnabled ? Check : Sync} /> Auto Refresh{" "}
            {autoRefreshEnabled ? "Enabled" : "Disabled"}
          </Button>{" "}
          <Button
            outline={!contestTableCondensed}
            active={contestTableCondensed}
            onClick={(): void =>
              setProblemTableCondensed(!contestTableCondensed)
            }
          >
            <Octicon icon={contestTableCondensed ? Check : Book} /> Condensed
            Table {contestTableCondensed ? "Enabled" : "Disabled"}
          </Button>
        </Col>
      </Row>

      <Row className="my-2">
        <Col sm="12">
          {contestInfo.mode === "lockout" ? (
            <LockoutContestTable
              showProblems={showProblems}
              problems={problems}
              participants={contestInfo.participants}
              enableAutoRefresh={autoRefreshEnabled}
              start={start}
              end={end}
            />
          ) : (
            <ContestTable
              showProblems={showProblems}
              problems={problems}
              users={contestInfo.participants}
              enableEstimatedPerformances={enableEstimatedPerformances}
              start={start}
              end={end}
              enableAutoRefresh={autoRefreshEnabled}
              condensed={contestTableCondensed}
            />
          )}
        </Col>
      </Row>
    </>
  );
};

const ShowContest = connect<OuterProps, InnerProps>((props: OuterProps) => {
  return {
    problemModelGet: {
      comparison: null,
      value: (): Promise<ImmutableMap<string, ProblemModel>> =>
        CachedApi.cachedProblemModels(),
    },
    userInfoGet: {
      url: USER_GET,
    },
    contestInfoFetch: {
      force: true,
      url: contestGetUrl(props.contestId),
    },
    problemMapFetch: {
      comparison: null,
      value: (): Promise<ImmutableMap<string, MergedProblem>> =>
        CachedApi.cachedMergedProblemMap(),
    },
    joinContest: () => ({
      joinContestPost: {
        url: CONTEST_JOIN,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contest_id: props.contestId }),
        andThen: () => ({
          contestInfoFetch: {
            url: contestGetUrl(props.contestId),
            force: true,
          },
        }),
      },
    }),
    joinContestPost: { value: null },
  };
})(InnerShowContest);

export default (): React.ReactElement => {
  const { contestId } = useParams();
  if (contestId) {
    return <ShowContest contestId={contestId} />;
  } else {
    return <Redirect to="/contest/recent" />;
  }
};

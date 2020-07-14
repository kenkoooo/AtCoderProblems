import React, { useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
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
import Octicon, { Check, Sync, Pin } from "@primer/octicons-react";
import { Map as ImmutableMap } from "immutable";
import * as CachedApi from "../../../../utils/CachedApiClient";
import { ProblemId } from "../../../../interfaces/Status";
import {
  CONTEST_JOIN,
  CONTEST_LEAVE,
  contestGetUrl,
  USER_GET,
} from "../../ApiUrl";
import MergedProblem from "../../../../interfaces/MergedProblem";
import ProblemModel from "../../../../interfaces/ProblemModel";
import {
  formatMomentDateTimeDay,
  parseSecond,
} from "../../../../utils/DateUtil";
import { formatMode, UserResponse, VirtualContestDetails } from "../../types";
import { TweetButton } from "../../../../components/TweetButton";
import { GITHUB_LOGIN_LINK } from "../../../../utils/Url";
import { Timer } from "../../../../components/Timer";
import { ACCOUNT_INFO } from "../../../../utils/RouterPath";
import { ContestTable } from "./ContestTable";
import { LockoutContestTable } from "./LockoutContestTable";
import { TrainingContestTable } from "./TrainingContestTable";

interface OuterProps {
  contestId: string;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<VirtualContestDetails>;
  userInfoGet: PromiseState<UserResponse | null>;
  joinContest: () => void;
  joinContestPost: PromiseState<{} | null>;
  leaveContest: () => void;
  leaveContestPost: PromiseState<{} | null>;
  problemMapFetch: PromiseState<ImmutableMap<ProblemId, MergedProblem>>;
  problemModelGet: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
}

const InnerShowContest: React.FC<InnerProps> = (props) => {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [pinMe, setPinMe] = useState(false);
  const history = useHistory();
  const { contestInfoFetch, userInfoGet, problemMapFetch } = props;

  if (contestInfoFetch.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (contestInfoFetch.rejected) {
    return <Alert color="danger">Failed to fetch contest info.</Alert>;
  }

  const problemMap = problemMapFetch.fulfilled
    ? problemMapFetch.value
    : ImmutableMap<ProblemId, MergedProblem>();
  const {
    info: contestInfo,
    participants: contestParticipants,
    problems: contestProblems,
  } = contestInfoFetch.value;
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
    userIdIsSet && contestParticipants.includes(atCoderUserId);
  const now = Math.floor(Date.now() / 1000);
  const canJoin = !alreadyJoined && userIdIsSet && now < end;
  const canLeave = alreadyJoined && userIdIsSet && now < start;
  const isOwner = contestInfo.owner_user_id === internalUserId;
  const enableEstimatedPerformances =
    contestParticipants.length * contestProblems.length <=
    (now < end ? 100 : 500);

  const showProblems = start < now;
  const problems = contestProblems.map((item) => {
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
            {canLeave ? (
              <Button onClick={(): void => props.leaveContest()}>Leave</Button>
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
          <ButtonGroup>
            <Button
              outline={!autoRefreshEnabled}
              active={autoRefreshEnabled}
              onClick={(): void => setAutoRefreshEnabled(!autoRefreshEnabled)}
            >
              <Octicon icon={autoRefreshEnabled ? Check : Sync} /> Auto Refresh{" "}
              {autoRefreshEnabled ? "Enabled" : "Disabled"}
            </Button>
            {alreadyJoined ? (
              <Button
                outline={!pinMe}
                active={pinMe}
                onClick={(): void => setPinMe(!pinMe)}
              >
                <Octicon icon={pinMe ? Check : Pin} />{" "}
                {pinMe ? "Unpin me" : "Pin me"}
              </Button>
            ) : null}
          </ButtonGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col sm="12">
          {contestInfo.mode === "lockout" ? (
            <LockoutContestTable
              showProblems={showProblems}
              problems={problems}
              participants={contestParticipants}
              enableAutoRefresh={autoRefreshEnabled}
              start={start}
              end={end}
            />
          ) : contestInfo.mode === "training" ? (
            <TrainingContestTable
              showProblems={showProblems}
              problems={problems}
              users={contestParticipants}
              start={start}
              end={end}
              enableAutoRefresh={autoRefreshEnabled}
            />
          ) : (
            <ContestTable
              showProblems={showProblems}
              problems={problems}
              users={contestParticipants}
              enableEstimatedPerformances={enableEstimatedPerformances}
              start={start}
              end={end}
              enableAutoRefresh={autoRefreshEnabled}
              atCoderUserId={atCoderUserId}
              pinMe={pinMe}
            />
          )}
        </Col>
      </Row>
    </>
  );
};

export const ShowContest = connect<OuterProps, InnerProps>(
  (props: OuterProps) => {
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
          force: true,
        },
      }),
      joinContestPost: { value: null },
      leaveContest: () => ({
        leaveContestPost: {
          url: CONTEST_LEAVE,
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
          force: true,
        },
      }),
      leaveContestPost: { value: null },
    };
  }
)(InnerShowContest);

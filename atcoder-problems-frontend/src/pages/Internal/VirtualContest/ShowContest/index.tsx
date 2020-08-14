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
  Badge,
  FormGroup,
  Label,
  CustomInput,
} from "reactstrap";
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
  getNowMillis,
  parseSecond,
} from "../../../../utils/DateUtil";
import {
  formatMode,
  UserResponse,
  VirtualContestDetails,
  formatPublicState,
} from "../../types";
import { TweetButton } from "../../../../components/TweetButton";
import { GITHUB_LOGIN_LINK } from "../../../../utils/Url";
import { Timer } from "../../../../components/Timer";
import { ACCOUNT_INFO } from "../../../../utils/RouterPath";
import { useLocalStorage } from "../../../../utils/LocalStorage";
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showRating, setShowRating] = useLocalStorage("showRating", false);
  const [pinMe, setPinMe] = useLocalStorage("pinMe", false);
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
  const penaltySecond = contestInfo.penalty_second;
  const alreadyJoined =
    userIdIsSet && contestParticipants.includes(atCoderUserId);
  const now = getNowMillis();
  const canJoin = !alreadyJoined && userIdIsSet && now < end;
  const canLeave = alreadyJoined && userIdIsSet && now < start;
  const isOwner = contestInfo.owner_user_id === internalUserId;
  const enableEstimatedPerformances = contestProblems.length < 10;

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
      <Row>
        <Col md="auto">
          <h1>{contestInfo.title}</h1>
        </Col>
        <Col md="auto" className="align-items-center d-flex">
          <Badge color={contestInfo.is_public ? "success" : "danger"}>
            {formatPublicState(contestInfo.is_public)}
          </Badge>
          <Badge>Mode: {formatMode(contestInfo.mode)}</Badge>
        </Col>
      </Row>
      <Row>
        <Col>
          <h4>{contestInfo.memo}</h4>
        </Col>
      </Row>
      <Row className="my-2">
        <Col>
          <Table>
            <tbody>
              <tr>
                <th>Time</th>
                <td>
                  {formatMomentDateTimeDay(parseSecond(start))} -{" "}
                  {formatMomentDateTimeDay(parseSecond(end))}
                </td>
              </tr>
              <tr>
                <th>Penalty</th>
                <td>{penaltySecond} seconds for each wrong submission</td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col>
          <Table>
            <tbody>
              {start < now && now < end ? (
                <tr>
                  <th>Remaining</th>
                  <td>
                    <Timer end={end} />
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
            <TweetButton
              id={contestInfo.id}
              text={contestInfo.title}
              color="primary"
            >
              Tweet
            </TweetButton>
          </ButtonGroup>{" "}
          <span className="ml-2">
            <FormGroup check inline>
              <Label check>
                <CustomInput
                  type="switch"
                  id="autoRefresh"
                  label="Auto Refresh"
                  checked={autoRefresh}
                  onChange={(): void => setAutoRefresh(!autoRefresh)}
                />
              </Label>
            </FormGroup>
            <FormGroup check inline>
              <Label check>
                <CustomInput
                  type="switch"
                  id="showRating"
                  label="Show Rating"
                  checked={showRating}
                  onChange={(): void => setShowRating(!showRating)}
                />
              </Label>
            </FormGroup>
            {alreadyJoined ? (
              <FormGroup check inline>
                <Label check>
                  <CustomInput
                    type="switch"
                    id="pinMe"
                    label="Pin me"
                    checked={pinMe}
                    onChange={(): void => setPinMe(!pinMe)}
                  />
                </Label>
              </FormGroup>
            ) : null}
          </span>
        </Col>
      </Row>

      <Row className="my-2">
        <Col sm="12">
          {contestInfo.mode === "lockout" ? (
            <LockoutContestTable
              showRating={showRating}
              showProblems={showProblems}
              problems={problems}
              participants={contestParticipants}
              enableAutoRefresh={autoRefresh}
              start={start}
              end={end}
            />
          ) : contestInfo.mode === "training" ? (
            <TrainingContestTable
              showRating={showRating}
              showProblems={showProblems}
              problems={problems}
              users={contestParticipants}
              start={start}
              end={end}
              enableAutoRefresh={autoRefresh}
            />
          ) : (
            <ContestTable
              contestId={contestInfo.id}
              contestTitle={contestInfo.title}
              showRating={showRating}
              showProblems={showProblems}
              problems={problems}
              users={contestParticipants}
              enableEstimatedPerformances={enableEstimatedPerformances}
              start={start}
              end={end}
              enableAutoRefresh={autoRefresh}
              atCoderUserId={atCoderUserId}
              pinMe={pinMe}
              penaltySecond={penaltySecond}
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

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
  Form,
  FormGroup,
  CustomInput,
  Collapse,
} from "reactstrap";
import { Map as ImmutableMap } from "immutable";
import Octicon, { ChevronDown, ChevronUp } from "@primer/octicons-react";
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
  VirtualContestItem,
} from "../../types";
import { TweetButton } from "../../../../components/TweetButton";
import { GITHUB_LOGIN_LINK } from "../../../../utils/Url";
import { Timer } from "../../../../components/Timer";
import { ACCOUNT_INFO } from "../../../../utils/RouterPath";
import { useLocalStorage } from "../../../../utils/LocalStorage";
import { ProblemLink } from "../../../../components/ProblemLink";
import { ContestTable } from "./ContestTable";
import { LockoutContestTable } from "./LockoutContestTable";
import { TrainingContestTable } from "./TrainingContestTable";
import { compareProblem } from "./util";

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
  const [showProblemTable, setShowProblemTable] = useState(true);
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
  const problems = contestProblems.map((item): {
    item: VirtualContestItem;
    contestId?: string;
    title?: string;
  } => {
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

  const sortedItems = problems
    .map((p) => ({
      contestId: p.contestId,
      title: p.title,
      ...p.item,
    }))
    .sort(compareProblem);

  return (
    <>
      <Row className="mb-2">
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
        <Col lg="6" md="12">
          <Table className="mb-0">
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
        <Col lg="6" md="12">
          <Table className="mb-0">
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
          </ButtonGroup>
        </Col>
      </Row>

      {showProblems && formatMode(contestInfo.mode) === "Normal" && (
        <div className="my-2">
          <Row>
            <Col>
              <div
                style={{
                  display: "flex",
                  flexFlow: "row wrap",
                  alignItems: "center",
                }}
              >
                <h3>Problems</h3>
                <Button
                  color="secondary"
                  size="sm"
                  onClick={() => setShowProblemTable(!showProblemTable)}
                  className="mx-3"
                >
                  <Octicon icon={showProblemTable ? ChevronUp : ChevronDown} />
                </Button>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
              <Collapse isOpen={showProblemTable}>
                <Table striped size="sm">
                  <thead>
                    <tr>
                      <th> </th>
                      <th>Problem Name</th>
                      <th className="text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((p, i) => (
                      <tr key={i}>
                        <th className="text-center">
                          {p.contestId && p.title ? (
                            <ProblemLink
                              problemId={p.id}
                              contestId={p.contestId}
                              problemTitle={`${i + 1}`}
                            />
                          ) : (
                            i + 1
                          )}
                        </th>
                        <td>
                          {p.contestId && p.title ? (
                            <ProblemLink
                              problemId={p.id}
                              contestId={p.contestId}
                              problemTitle={p.title}
                            />
                          ) : (
                            p.id
                          )}
                        </td>
                        <td className="text-center">
                          {p.point !== null && p.point}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Collapse>
            </Col>
          </Row>
        </div>
      )}

      <div className="my-2">
        <Row>
          <Col>
            <Form inline>
              <h3>Standings</h3>
              <FormGroup inline className="ml-3">
                <CustomInput
                  type="switch"
                  id="autoRefresh"
                  label="Auto Refresh"
                  inline
                  checked={autoRefresh}
                  onChange={(): void => setAutoRefresh(!autoRefresh)}
                />
                <CustomInput
                  type="switch"
                  id="showRating"
                  label="Show Rating"
                  inline
                  checked={showRating}
                  onChange={(): void => setShowRating(!showRating)}
                />
                {alreadyJoined && (
                  <CustomInput
                    type="switch"
                    id="pinMe"
                    label="Pin me"
                    inline
                    checked={pinMe}
                    onChange={(): void => setPinMe(!pinMe)}
                  />
                )}
              </FormGroup>
            </Form>
          </Col>
        </Row>
        <Row>
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
      </div>
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

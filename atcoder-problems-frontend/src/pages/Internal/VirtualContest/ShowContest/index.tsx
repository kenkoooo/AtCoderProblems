import React, { useState } from "react";
import {
  NavLink as RouterLink,
  useHistory,
  useLocation,
} from "react-router-dom";
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
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import { FcCancel, FcCheckmark } from "react-icons/all";
import {
  useMergedProblemMap,
  useVirtualContestSubmissions,
} from "../../../../api/APIClient";
import {
  useLoginState,
  useVirtualContest,
} from "../../../../api/InternalAPIClient";
import {
  formatMomentDateTimeDay,
  getCurrentUnixtimeInSecond,
  parseSecond,
} from "../../../../utils/DateUtil";
import {
  formatMode,
  formatPublicState,
  VirtualContestInfo,
  VirtualContestProblem,
} from "../../types";
import { TweetButton } from "../../../../components/TweetButton";
import { useLoginLink } from "../../../../utils/Url";
import { Timer } from "../../../../components/Timer";
import { ACCOUNT_INFO } from "../../../../utils/RouterPath";
import { useLocalStorage } from "../../../../utils/LocalStorage";
import { generatePathWithParams } from "../../../../utils/QueryString";
import { ProblemLink } from "../../../../components/ProblemLink";
import { joinContest, leaveContest } from "../ApiClient";
import { GoogleCalendarButton } from "../../../../components/GoogleCalendarButton";
import { ProblemId, UserId } from "../../../../interfaces/Status";
import { constructPointOverrideMap, ContestTable } from "./ContestTable";
import { LockoutContestTable } from "./LockoutContestTable";
import { TrainingContestTable } from "./TrainingContestTable";
import { compareProblem } from "./util";
import {
  ReducedProblemResult,
  reduceUserContestResult,
} from "./ResultCalcUtil";

const Problems = (props: {
  readonly alreadyJoined: boolean;
  readonly problems: VirtualContestProblem[];
  readonly atCoderUserId: UserId;
  readonly start: number;
  readonly end: number;
}) => {
  const { alreadyJoined } = props;
  const submissions = useVirtualContestSubmissions(
    alreadyJoined ? [props.atCoderUserId] : [],
    props.problems.map((p) => p.item.id),
    props.start,
    props.end,
    false
  );
  const pointOverrideMap = constructPointOverrideMap(props.problems);
  const showUserResults = alreadyJoined && submissions.data;
  const results = submissions.data
    ? reduceUserContestResult(submissions.data, (id) =>
        pointOverrideMap.get(id)
      )
    : new Map<UserId, ReducedProblemResult>();
  const ResultIcon = (props: { id: ProblemId }) => {
    const result = results.get(props.id);
    if (!result) return null;
    if (result.accepted) {
      return <FcCheckmark />;
    } else {
      return <FcCancel />;
    }
  };

  const sortedItems = props.problems
    .map((p) => ({
      contestId: p.contestId,
      title: p.title,
      ...p.item,
    }))
    .sort(compareProblem);

  return (
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
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <Table striped bordered size="sm">
            <thead>
              <tr>
                <th> </th>
                <th>Problem Name</th>
                <th className="text-center">Score</th>
                {showUserResults && <th> </th>}
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
                        problemName={`${i + 1}`}
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
                        problemName={p.title}
                      />
                    ) : (
                      p.id
                    )}
                  </td>
                  <td className="text-center">{p.point !== null && p.point}</td>
                  {showUserResults && (
                    <td className="text-center">
                      <ResultIcon id={p.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </div>
  );
};

interface StandingsProps {
  readonly alreadyJoined: boolean;
  readonly contestInfo: VirtualContestInfo;
  readonly showProblems: boolean;
  readonly problems: VirtualContestProblem[];
  readonly contestParticipants: string[];
  readonly start: number;
  readonly end: number;
  readonly enableEstimatedPerformances?: boolean;
  readonly atCoderUserId?: string;
  readonly penaltySecond?: number;
}

const Standings = (props: StandingsProps) => {
  const { alreadyJoined, contestInfo } = props;
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showRating, setShowRating] = useLocalStorage("showRating", false);
  const [pinMe, setPinMe] = useLocalStorage("pinMe", false);
  return (
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
              {alreadyJoined && contestInfo.mode === null && (
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
              participants={props.contestParticipants}
              enableAutoRefresh={autoRefresh}
              {...props}
            />
          ) : contestInfo.mode === "training" ? (
            <TrainingContestTable
              showRating={showRating}
              users={props.contestParticipants}
              enableAutoRefresh={autoRefresh}
              {...props}
            />
          ) : (
            <ContestTable
              contestId={contestInfo.id}
              contestTitle={contestInfo.title}
              showRating={showRating}
              users={props.contestParticipants}
              enableAutoRefresh={autoRefresh}
              pinMe={pinMe}
              enableEstimatedPerformances={
                props.enableEstimatedPerformances ?? false
              }
              atCoderUserId={props.atCoderUserId ?? ""}
              penaltySecond={props.penaltySecond ?? 0}
              {...props}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

const NormalContestTabTypes = ["Problems", "Standings"] as const;
type NormalContestTabType = typeof NormalContestTabTypes[number];
const TAB_PARAM = "activeTab";

interface NormalContestPageProps extends StandingsProps {
  readonly enableEstimatedPerformances: boolean;
  readonly atCoderUserId: string;
  readonly penaltySecond: number;
}

const NormalContestPage = (props: NormalContestPageProps) => {
  const location = useLocation();
  const { showProblems } = props;
  const tabs: NormalContestTabType[] = showProblems
    ? ["Problems", "Standings"]
    : ["Standings"];
  const getActiveTab = (): NormalContestTabType => {
    // Be secure against malicious params.
    // e.g. "Set activeTab=Problems before contest beginning."
    const beforeContestBegin = !showProblems;
    if (beforeContestBegin) return "Standings";
    else {
      const tabParam = new URLSearchParams(location.search).get(TAB_PARAM);
      return NormalContestTabTypes.find((p) => p === tabParam) ?? tabs[0];
    }
  };
  const activeTab = getActiveTab();
  return (
    <>
      <Row>
        <Col>
          <Nav tabs>
            {tabs.map((tab) => (
              <NavItem key={tab}>
                <NavLink
                  tag={RouterLink}
                  isActive={() => activeTab === tab}
                  to={generatePathWithParams(location, { [TAB_PARAM]: tab })}
                >
                  {tab}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
        </Col>
      </Row>

      {activeTab === "Problems" && <Problems {...props} />}
      {activeTab === "Standings" && <Standings {...props} />}
    </>
  );
};

interface Props {
  contestId: string;
}

export const ShowContest = (props: Props) => {
  const loginState = useLoginState();
  const history = useHistory();
  const virtualContestResponse = useVirtualContest(props.contestId);
  const { data: problemMap } = useMergedProblemMap();
  const loginLink = useLoginLink();

  if (!virtualContestResponse.data && !virtualContestResponse.error) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (!virtualContestResponse.data) {
    return <Alert color="danger">Failed to fetch contest info.</Alert>;
  }

  const {
    info: contestInfo,
    participants: contestParticipants,
    problems: contestProblems,
  } = virtualContestResponse.data;
  const rawAtCoderUserId = loginState.data?.atcoder_user_id;
  const internalUserId = loginState?.data?.internal_user_id;

  const atCoderUserId = rawAtCoderUserId ? rawAtCoderUserId : "";
  const isLoggedIn = internalUserId !== undefined;
  const userIdIsSet = atCoderUserId !== "";

  const start = contestInfo.start_epoch_second;
  const end = contestInfo.start_epoch_second + contestInfo.duration_second;
  const penaltySecond = contestInfo.penalty_second;
  const alreadyJoined =
    userIdIsSet && contestParticipants.includes(atCoderUserId);
  const now = getCurrentUnixtimeInSecond();
  const canJoin = !alreadyJoined && userIdIsSet && now < end;
  const canLeave = alreadyJoined && userIdIsSet && now < start;
  const isOwner = contestInfo.owner_user_id === internalUserId;
  const enableEstimatedPerformances = contestProblems.length < 10;

  const showProblems = start <= now;
  const problems = contestProblems.map(
    (item): VirtualContestProblem => {
      const problem = problemMap?.get(item.id);
      if (problem) {
        return {
          item,
          contestId: problem.contest_id,
          title: `${problem.problem_index}. ${problem.name}`,
        };
      } else {
        return { item };
      }
    }
  );

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
              {now < start ? (
                <tr>
                  <th>Begin in</th>
                  <td>
                    <Timer end={start} />
                  </td>
                </tr>
              ) : now < end ? (
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
              Please <a href={loginLink}>Login</a> before you join the contest.
            </Alert>
          ) : !userIdIsSet ? (
            <Alert color="warning">
              Please set the AtCoder ID from{" "}
              <NavLink to={ACCOUNT_INFO}>here</NavLink>, before you join the
              contest.
            </Alert>
          ) : null}
          <ButtonGroup>
            {canJoin && (
              <Button
                onClick={async () => {
                  await joinContest(props.contestId);
                  await virtualContestResponse.revalidate();
                }}
              >
                Join
              </Button>
            )}
            {canLeave && (
              <Button
                onClick={async () => {
                  await leaveContest(props.contestId);
                  await virtualContestResponse.revalidate();
                }}
              >
                Leave
              </Button>
            )}
            {isOwner && (
              <Button
                onClick={(): void =>
                  history.push({
                    pathname: `/contest/update/${contestInfo.id}`,
                  })
                }
              >
                Edit
              </Button>
            )}
            <TweetButton
              id={contestInfo.id}
              text={contestInfo.title}
              color="primary"
            >
              Tweet
            </TweetButton>
            {now < end && (
              <GoogleCalendarButton
                contestId={contestInfo.id}
                title={contestInfo.title}
                startEpochSecond={start}
                endEpochSecond={end}
              />
            )}
          </ButtonGroup>
        </Col>
      </Row>

      {contestInfo.mode !== null ? (
        <Standings
          alreadyJoined={alreadyJoined}
          contestInfo={contestInfo}
          showProblems={showProblems}
          problems={problems}
          contestParticipants={contestParticipants}
          start={start}
          end={end}
        />
      ) : (
        <NormalContestPage
          alreadyJoined={alreadyJoined}
          contestInfo={contestInfo}
          showProblems={showProblems}
          problems={problems}
          contestParticipants={contestParticipants}
          start={start}
          end={end}
          enableEstimatedPerformances={enableEstimatedPerformances}
          atCoderUserId={atCoderUserId}
          penaltySecond={penaltySecond}
        />
      )}
    </>
  );
};

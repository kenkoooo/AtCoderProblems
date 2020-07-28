import React from "react";
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledButtonDropdown,
  UncontrolledDropdown,
  Button,
} from "reactstrap";
import { Link, useHistory, useLocation } from "react-router-dom";
import ButtonGroup from "reactstrap/lib/ButtonGroup";
import { List, Map, Range, Set } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { DifficultyCircle } from "../../components/DifficultyCircle";
import ProblemModel from "../../interfaces/ProblemModel";
import {
  constructStatusLabelMap,
  noneStatus,
  ProblemId,
  ProblemStatus,
  StatusLabel,
} from "../../interfaces/Status";
import Submission from "../../interfaces/Submission";
import Contest from "../../interfaces/Contest";
import MergedProblem from "../../interfaces/MergedProblem";
import { formatMomentDate, parseSecond } from "../../utils/DateUtil";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { RatingInfo } from "../../utils/RatingInfo";
import { generatePathWithParams } from "../../utils/QueryString";
import { fetchUserSubmissions } from "../../utils/Api";
import { PROGRESS_RESET_LIST, USER_GET } from "../Internal/ApiUrl";
import {
  filterResetProgress,
  ProgressResetList,
  UserResponse,
} from "../Internal/types";
import { ListTable } from "./ListTable";
import { DifficultyTable } from "./DifficultyTable";
import { SmallTable } from "./SmallTable";

export const INF_POINT = 1e18;

export interface ProblemRowData {
  readonly id: string;
  readonly title: string;
  readonly contest?: Contest;
  readonly contestDate: string;
  readonly contestTitle: string;
  readonly lastAcceptedDate: string;
  readonly solverCount: number;
  readonly point: number;
  readonly problemModel?: ProblemModel;
  readonly firstUserId: string;
  readonly executionTime: number;
  readonly codeLength: number;
  readonly mergedProblem: MergedProblem;
  readonly shortestUserId: string;
  readonly fastestUserId: string;
  readonly status: ProblemStatus;
}

const statusFilters = ["All", "Only Trying", "Only AC"] as const;
type StatusFilter = typeof statusFilters[number];
const convertToValidStatusFilterState = (
  value: string | null
): StatusFilter => {
  for (const filter of statusFilters) {
    if (value === filter) {
      return value;
    }
  }

  return "All";
};

const RATED_FILTERS = [
  "All",
  "Only Rated",
  "Only Unrated",
  "Only Unrated without Difficulty",
] as const;
type RatedFilter = typeof RATED_FILTERS[number];
const convertToValidRatedFilter = (value: string | null): RatedFilter => {
  for (const filter of RATED_FILTERS) {
    if (value === filter) {
      return value;
    }
  }

  return "All";
};
const FilterParams = {
  FromPoint: "fromPo",
  ToPoint: "toPo",
  Status: "status",
  Rated: "rated",
  FromDifficulty: "fromDiff",
  ToDifficulty: "toDiff",
} as const;

const InnerListPage: React.FC<InnerProps> = (props) => {
  const location = useLocation();
  const history = useHistory();
  const searchParams = new URLSearchParams(location.search);

  const fromPoint = parseInt(
    searchParams.get(FilterParams.FromPoint) || "0",
    10
  );
  const toPoint = parseInt(
    searchParams.get(FilterParams.ToPoint) || INF_POINT.toString(),
    10
  );
  const setExactPointFilter = (point: number): void => {
    const params = new URLSearchParams(location.search);
    params.set(FilterParams.FromPoint, point.toString());
    params.set(FilterParams.ToPoint, point.toString());
    history.push({ ...location, search: params.toString() });
  };
  const statusFilterState: StatusFilter = convertToValidStatusFilterState(
    searchParams.get(FilterParams.Status)
  );
  const ratedFilterState: RatedFilter = convertToValidRatedFilter(
    searchParams.get(FilterParams.Rated)
  );
  const fromDifficulty = parseInt(
    searchParams.get(FilterParams.FromDifficulty) || "-1",
    10
  );
  const toDifficulty: number = parseInt(
    searchParams.get(FilterParams.ToDifficulty) || INF_POINT.toString(),
    10
  );
  const setDifficultyFilter = (from: number, to: number): void => {
    const params = new URLSearchParams(location.search);
    params.set(FilterParams.FromDifficulty, from.toString());
    params.set(FilterParams.ToDifficulty, to.toString());
    history.push({ ...location, search: params.toString() });
  };

  const {
    mergedProblemsFetch,
    problemModelsFetch,
    submissionsFetch,
    contestsFetch,
    userRatingInfoFetch,
  } = props;

  const mergedProblems = mergedProblemsFetch.fulfilled
    ? mergedProblemsFetch.value
    : Map<ProblemId, MergedProblem>();
  const contests = contestsFetch.fulfilled
    ? contestsFetch.value
    : Map<string, Contest>();
  const problemModels = problemModelsFetch.fulfilled
    ? problemModelsFetch.value
    : Map<ProblemId, ProblemModel>();
  const submissions = submissionsFetch.fulfilled ? submissionsFetch.value : [];

  const loginUserId =
    props.loginState.fulfilled &&
    props.loginState.value &&
    props.loginState.value.atcoder_user_id
      ? props.loginState.value.atcoder_user_id
      : undefined;
  const progressReset =
    props.progressResetList.fulfilled && props.progressResetList.value
      ? props.progressResetList.value
      : undefined;
  const filteredSubmissions =
    progressReset && loginUserId
      ? filterResetProgress(submissions, progressReset, loginUserId)
      : submissions;

  const statusLabelMap = constructStatusLabelMap(
    filteredSubmissions,
    props.userId
  );

  const userRatingInfo = userRatingInfoFetch.fulfilled
    ? userRatingInfoFetch.value
    : null;

  const rowData = mergedProblems
    .valueSeq()
    .map(
      (p): ProblemRowData => {
        const contest = contests.get(p.contest_id);
        const contestDate = contest
          ? formatMomentDate(parseSecond(contest.start_epoch_second))
          : "";
        const contestTitle = contest ? contest.title : "";

        const status = statusLabelMap.get(p.id) ?? noneStatus();
        const lastAcceptedDate =
          status.label === StatusLabel.Success
            ? formatMomentDate(parseSecond(status.lastAcceptedEpochSecond))
            : "";
        const point = p.point ?? INF_POINT;
        const firstUserId = p.first_user_id ? p.first_user_id : "";
        const executionTime =
          p.execution_time != null ? p.execution_time : INF_POINT;
        const codeLength = p.source_code_length
          ? p.source_code_length
          : INF_POINT;
        const shortestUserId = p.shortest_user_id ? p.shortest_user_id : "";
        const fastestUserId = p.fastest_user_id ? p.fastest_user_id : "";
        const problemModel = problemModels.get(p.id);
        return {
          id: p.id,
          title: p.title,
          contest,
          contestDate,
          contestTitle,
          lastAcceptedDate,
          solverCount: p.solver_count ? p.solver_count : 0,
          point,
          problemModel,
          firstUserId,
          executionTime,
          codeLength,
          mergedProblem: p,
          shortestUserId,
          fastestUserId,
          status,
        };
      }
    )
    .sort((a, b) => {
      const dateOrder = b.contestDate.localeCompare(a.contestDate);
      return dateOrder === 0 ? a.title.localeCompare(b.title) : dateOrder;
    })
    .toList();
  const points = mergedProblems
    .valueSeq()
    .map((p) => p.point)
    .reduce((set, point) => (point ? set.add(point) : set), Set<number>())
    .toList()
    .sort();
  const difficulties = Range(0, 4400, 400)
    .map((from) => ({
      from,
      to: from === 4000 ? INF_POINT : from + 399,
    }))
    .toList();

  return (
    <div>
      <Row className="my-2 border-bottom">
        <h1>Point Status</h1>
      </Row>
      <Row>
        <SmallTable
          mergedProblems={mergedProblems}
          submissions={filteredSubmissions}
          setFilterFunc={setExactPointFilter}
        />
      </Row>

      <Row className="my-2 border-bottom">
        <h1>Difficulty Status</h1>
      </Row>
      <Row>
        <DifficultyTable
          mergedProblems={mergedProblems}
          submissions={filteredSubmissions}
          problemModels={problemModels}
          setFilterFunc={setDifficultyFilter}
        />
      </Row>

      <Row className="my-2 border-bottom">
        <h1>Problem List</h1>
      </Row>
      <Row>
        <ButtonGroup className="mr-4">
          <UncontrolledButtonDropdown>
            <DropdownToggle caret>
              {fromPoint === 0 ? "Point From" : fromPoint}
            </DropdownToggle>
            <DropdownMenu>
              {points.map((p) => (
                <DropdownItem
                  key={p}
                  tag={Link}
                  to={generatePathWithParams(location, {
                    [FilterParams.FromPoint]: p.toString(),
                  })}
                >
                  {p}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </UncontrolledButtonDropdown>
          <UncontrolledButtonDropdown>
            <DropdownToggle caret>
              {toPoint === INF_POINT ? "Point To" : toPoint}
            </DropdownToggle>
            <DropdownMenu>
              {points.map((p) => (
                <DropdownItem
                  key={p}
                  tag={Link}
                  to={generatePathWithParams(location, {
                    [FilterParams.ToPoint]: p.toString(),
                  })}
                >
                  {p}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </UncontrolledButtonDropdown>
        </ButtonGroup>
        <ButtonGroup className="mr-4">
          <UncontrolledDropdown>
            <DropdownToggle caret>{statusFilterState}</DropdownToggle>
            <DropdownMenu>
              {statusFilters.map((status) => (
                <DropdownItem
                  key={status}
                  tag={Link}
                  to={generatePathWithParams(location, {
                    [FilterParams.Status]: status,
                  })}
                >
                  {status}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </UncontrolledDropdown>
        </ButtonGroup>
        <ButtonGroup className="mr-4">
          <UncontrolledDropdown>
            <DropdownToggle caret>{ratedFilterState}</DropdownToggle>
            <DropdownMenu>
              {RATED_FILTERS.map((value) => (
                <DropdownItem
                  key={value}
                  tag={Link}
                  to={generatePathWithParams(location, {
                    [FilterParams.Rated]: value,
                  })}
                >
                  {value}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </UncontrolledDropdown>
        </ButtonGroup>

        <ButtonGroup className="mr-4">
          <UncontrolledButtonDropdown>
            <DropdownToggle caret>
              {fromDifficulty === -1
                ? "Difficulty From"
                : `${fromDifficulty} - `}
            </DropdownToggle>
            <DropdownMenu>
              {difficulties.map(({ from, to }) => (
                <DropdownItem
                  key={from}
                  tag={Link}
                  to={generatePathWithParams(location, {
                    [FilterParams.FromDifficulty]: from.toString(),
                  })}
                >
                  <DifficultyCircle
                    problemModel={{
                      slope: undefined,
                      difficulty: to,
                      rawDifficulty: undefined,
                      intercept: undefined,
                      discrimination: undefined,
                      is_experimental: false,
                      variance: undefined,
                    }}
                    id={`from-difficulty-dropdown-${to}`}
                  />
                  {from} -
                </DropdownItem>
              ))}
            </DropdownMenu>
          </UncontrolledButtonDropdown>
          <UncontrolledButtonDropdown>
            <DropdownToggle caret>
              {toDifficulty === INF_POINT
                ? "Difficulty To"
                : ` - ${toDifficulty}`}
            </DropdownToggle>
            <DropdownMenu>
              {difficulties.map(({ to }) => (
                <DropdownItem
                  key={to}
                  tag={Link}
                  to={generatePathWithParams(location, {
                    [FilterParams.FromDifficulty]:
                      fromDifficulty !== -1 ? fromDifficulty.toString() : "0",
                    [FilterParams.ToDifficulty]: to.toString(),
                  })}
                >
                  <DifficultyCircle
                    problemModel={{
                      slope: undefined,
                      difficulty: to,
                      rawDifficulty: undefined,
                      intercept: undefined,
                      discrimination: undefined,
                      is_experimental: false,
                      variance: undefined,
                    }}
                    id={`from-difficulty-dropdown-${to}`}
                  />
                  - {to < INF_POINT ? to : "inf"}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </UncontrolledButtonDropdown>
        </ButtonGroup>
        <Button
          outline
          color="danger"
          onClick={(): void => history.push({ ...location, search: "" })}
        >
          Reset
        </Button>
      </Row>
      <Row className="mt-3">
        <ListTable
          fromPoint={fromPoint}
          toPoint={toPoint}
          statusFilterState={statusFilterState}
          ratedFilterState={ratedFilterState}
          fromDifficulty={fromDifficulty}
          toDifficulty={toDifficulty}
          rowData={rowData}
          userRatingInfo={userRatingInfo}
        />
      </Row>
    </div>
  );
};

interface OuterProps {
  readonly userId: string;
  readonly rivals: List<string>;
}

interface InnerProps extends OuterProps {
  readonly submissionsFetch: PromiseState<Submission[]>;
  readonly mergedProblemsFetch: PromiseState<Map<ProblemId, MergedProblem>>;
  readonly problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;
  readonly contestsFetch: PromiseState<Map<string, Contest>>;
  readonly userRatingInfoFetch: PromiseState<RatingInfo>;

  readonly loginState: PromiseState<UserResponse | null>;
  readonly progressResetList: PromiseState<ProgressResetList | null>;
}

export const ListPage = connect<OuterProps, InnerProps>((props) => ({
  submissionsFetch: {
    comparison: [props.userId, props.rivals],
    value: (): Promise<Submission[]> =>
      Promise.all(
        props.rivals.push(props.userId).map((id) => fetchUserSubmissions(id))
      ).then((arrays: Submission[][]) => arrays.flatMap((array) => array)),
  },
  mergedProblemsFetch: {
    comparison: null,
    value: (): Promise<Map<string, MergedProblem>> =>
      CachedApiClient.cachedMergedProblemMap(),
  },
  problemModelsFetch: {
    comparison: null,
    value: (): Promise<Map<string, ProblemModel>> =>
      CachedApiClient.cachedProblemModels(),
  },
  contestsFetch: {
    comparison: null,
    value: (): Promise<Map<string, Contest>> =>
      CachedApiClient.cachedContestMap(),
  },
  userRatingInfoFetch: {
    comparison: props.userId,
    value: (): Promise<RatingInfo> =>
      CachedApiClient.cachedRatingInfo(props.userId),
  },
  loginState: USER_GET,
  progressResetList: PROGRESS_RESET_LIST,
}))(InnerListPage);

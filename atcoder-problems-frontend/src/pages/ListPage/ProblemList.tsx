import { Range } from "immutable";
import React from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import {
  Button,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledButtonDropdown,
  UncontrolledDropdown,
} from "reactstrap";
import ButtonGroup from "reactstrap/lib/ButtonGroup";
import Submission from "../../interfaces/Submission";
import MergedProblem from "../../interfaces/MergedProblem";
import { ProblemId } from "../../interfaces/Status";
import { generatePathWithParams } from "../../utils/QueryString";
import * as UserState from "../../utils/UserState";
import { DifficultyCircle } from "../../components/DifficultyCircle";
import {
  createContestLocationFromProblemIds,
  selectRowPropsForProblemSelection,
  useProblemIdSelection,
} from "../../utils/ProblemSelection";
import { useLoginState } from "../../api/InternalAPIClient";
import { useMergedProblemMap } from "../../api/APIClient";
import { INF_POINT, ListTable, StatusFilter, statusFilters } from "./ListTable";

export const FilterParams = {
  FromPoint: "fromPo",
  ToPoint: "toPo",
  Status: "status",
  Rated: "rated",
  FromDifficulty: "fromDiff",
  ToDifficulty: "toDiff",
} as const;

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

interface Props {
  userId: string;
  submissions: Submission[];
}

export const ProblemList: React.FC<Props> = (props) => {
  const location = useLocation();
  const history = useHistory();

  const [getSelectedIds, selectIds, deselectIds] = useProblemIdSelection();
  const selectedIds = getSelectedIds();
  const createContest = () =>
    history.push(createContestLocationFromProblemIds(selectedIds));
  const selectRowProps = selectRowPropsForProblemSelection(
    selectedIds,
    getSelectedIds,
    selectIds,
    deselectIds
  );

  const searchParams = new URLSearchParams(location.search);

  const fromPoint = parseInt(
    searchParams.get(FilterParams.FromPoint) || "0",
    10
  );
  const toPoint = parseInt(
    searchParams.get(FilterParams.ToPoint) || INF_POINT.toString(),
    10
  );
  const statusFilterState: StatusFilter = convertToValidStatusFilterState(
    searchParams.get(FilterParams.Status)
  );
  const ratedFilterState: RatedFilter =
    RATED_FILTERS.find((x) => x === searchParams.get(FilterParams.Rated)) ??
    "All";
  const fromDifficulty = parseInt(
    searchParams.get(FilterParams.FromDifficulty) || "-1",
    10
  );
  const toDifficulty: number = parseInt(
    searchParams.get(FilterParams.ToDifficulty) || INF_POINT.toString(),
    10
  );
  const mergedProblemMap =
    useMergedProblemMap().data ?? new Map<ProblemId, MergedProblem>();
  const points = Array.from(
    new Set(
      Array.from(mergedProblemMap.values())
        .map((p) => p.point)
        .filter((p): p is number => !!p)
    )
  );
  const difficulties = Range(0, 4400, 400)
    .map((from) => ({
      from,
      to: from === 4000 ? INF_POINT : from + 399,
    }))
    .toList();

  const loginState = useLoginState().data;
  const isLoggedIn = UserState.isLoggedIn(loginState);

  return (
    <>
      <Row className="my-2 border-bottom">
        <h1>Problem List</h1>
      </Row>
      <Row className="my-3">
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
      {isLoggedIn && (
        <Row>
          <Button
            color="success"
            disabled={selectedIds.length === 0}
            onClick={createContest}
          >
            Create Virtual Contest
          </Button>
        </Row>
      )}
      <Row className="mt-3">
        <ListTable
          userId={props.userId}
          fromPoint={fromPoint}
          toPoint={toPoint}
          statusFilterState={statusFilterState}
          ratedFilterState={ratedFilterState}
          fromDifficulty={fromDifficulty}
          toDifficulty={toDifficulty}
          filteredSubmissions={props.submissions}
          selectRow={isLoggedIn ? selectRowProps : undefined}
        />
      </Row>
    </>
  );
};

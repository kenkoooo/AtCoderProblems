import React, { ReactElement } from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import {
  Badge,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Row,
  UncontrolledButtonDropdown,
  UncontrolledDropdown
} from "reactstrap";

import { clipDifficulty, isAccepted } from "../../utils";
import { formatMoment, parseSecond } from "../../utils/DateUtil";
import * as Url from "../../utils/Url";
import MergedProblem from "../../interfaces/MergedProblem";
import Contest from "../../interfaces/Contest";
import Submission from "../../interfaces/Submission";
import SmallTable from "./SmallTable";
import ButtonGroup from "reactstrap/lib/ButtonGroup";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import State, {
  noneStatus,
  ProblemId,
  ProblemStatus,
  StatusLabel
} from "../../interfaces/State";
import { List, Map, Range, Set } from "immutable";
import { requestMergedProblems } from "../../actions";
import ProblemModel from "../../interfaces/ProblemModel";
import ProblemLink from "../../components/ProblemLink";
import { DifficultyCircle } from "../../components/DifficultyCircle";

const INF_POINT = 1e18;

interface ProblemRowData {
  readonly id: string;
  readonly title: string;
  readonly contestDate: string;
  readonly contestTitle: string;
  readonly lastAcceptedDate: string;
  readonly solverCount: number;
  readonly point: number;
  readonly difficulty: number;
  readonly firstUserId: string;
  readonly executionTime: number;
  readonly codeLength: number;
  readonly mergedProblem: MergedProblem;
  readonly shortestUserId: string;
  readonly fastestUserId: string;
  readonly status: ProblemStatus;
}

interface ListPageState {
  fromPoint: number;
  toPoint: number;
  statusFilterState: "All" | "Only Trying" | "Only AC";
  ratedFilterState: "All" | "Only Rated" | "Only Unrated";
  fromDifficulty: number;
  toDifficulty: number;
}

class ListPage extends React.Component<Props, ListPageState> {
  constructor(props: any) {
    super(props);
    this.state = {
      fromPoint: 0,
      toPoint: INF_POINT,
      statusFilterState: "All",
      ratedFilterState: "All",
      fromDifficulty: -1,
      toDifficulty: INF_POINT
    };
  }

  componentDidMount(): void {
    this.props.requestData();
  }

  render() {
    const {
      mergedProblems,
      problemModels,
      submissions,
      userId,
      rivals,
      contests,
      statusLabelMap
    } = this.props;
    const {
      fromPoint,
      toPoint,
      ratedFilterState,
      statusFilterState,
      fromDifficulty,
      toDifficulty
    } = this.state;
    const rowData = mergedProblems
      .valueSeq()
      .map(
        (p): ProblemRowData => {
          const contest = contests.get(p.contest_id);
          const contestDate = contest
            ? formatMoment(parseSecond(contest.start_epoch_second))
            : "";
          const contestTitle = contest ? contest.title : "";

          const lastSubmission = submissions
            .get(p.id, List<Submission>())
            .filter(s => s.user_id === userId)
            .filter(s => isAccepted(s.result))
            .maxBy(s => s.epoch_second);
          const lastAcceptedDate = lastSubmission
            ? formatMoment(parseSecond(lastSubmission.epoch_second))
            : "";
          const point = p.point ? p.point : p.predict ? p.predict : INF_POINT;
          const firstUserId = p.first_user_id ? p.first_user_id : "";
          const executionTime =
            p.execution_time != null ? p.execution_time : INF_POINT;
          const codeLength = p.source_code_length
            ? p.source_code_length
            : INF_POINT;
          const shortestUserId = p.shortest_user_id ? p.shortest_user_id : "";
          const fastestUserId = p.fastest_user_id ? p.fastest_user_id : "";
          const difficulty = Math.round(
            problemModels.getIn([p.id, "difficulty"], INF_POINT)
          );
          const difficultyClipped = clipDifficulty(difficulty);

          return {
            id: p.id,
            title: p.title,
            contestDate,
            contestTitle,
            lastAcceptedDate,
            solverCount: p.solver_count ? p.solver_count : 0,
            point,
            difficulty: difficultyClipped,
            firstUserId,
            executionTime,
            codeLength,
            mergedProblem: p,
            shortestUserId,
            fastestUserId,
            status: statusLabelMap.get(p.id, noneStatus())
          };
        }
      )
      .sort((a, b) => b.contestDate.localeCompare(a.contestDate))
      .toList();

    const columns: {
      header: string;
      dataField: string;
      dataSort?: boolean;
      dataAlign?: "center";
      dataFormat?: (cell: any, row: ProblemRowData) => ReactElement | string;
      hidden?: boolean;
    }[] = [
      {
        header: "Date",
        dataField: "contestDate",
        dataSort: true
      },
      {
        header: "Problem",
        dataField: "title",
        dataSort: true,
        dataFormat: (_, row) => (
          <ProblemLink
            showDifficulty={true}
            difficulty={row.difficulty !== INF_POINT ? row.difficulty : null}
            problemId={row.mergedProblem.id}
            problemTitle={row.title}
            contestId={row.mergedProblem.contest_id}
          />
        )
      },
      {
        header: "Contest",
        dataField: "contestTitle",
        dataSort: true,
        dataFormat: (contestTitle, row) => (
          <a
            href={Url.formatContestUrl(row.mergedProblem.contest_id)}
            target="_blank"
          >
            {contestTitle}
          </a>
        )
      },
      {
        header: "Result",
        dataField: "a",
        dataAlign: "center",
        dataFormat: (_: string, row) => {
          const { status } = row;
          switch (status.label) {
            case StatusLabel.Success: {
              return <Badge color="success">AC</Badge>;
            }
            case StatusLabel.Failed: {
              return (
                <div>
                  {status.solvedRivals.map(rivalId => (
                    <Badge key={rivalId} color="danger">
                      {rivalId}
                    </Badge>
                  ))}
                </div>
              );
            }
            case StatusLabel.Warning: {
              return <Badge color="warning">{status.result}</Badge>;
            }
            case StatusLabel.None: {
              return "";
            }
          }
        }
      },
      {
        header: "Last AC Date",
        dataField: "lastAcceptedDate",
        dataSort: true
      },
      {
        header: "Solvers",
        dataField: "solverCount",
        dataSort: true,
        dataFormat: (solverCount: number, row) => (
          <a
            href={Url.formatSolversUrl(
              row.mergedProblem.contest_id,
              row.mergedProblem.id
            )}
            target="_blank"
          >
            {solverCount}
          </a>
        )
      },
      {
        header: "Point",
        dataField: "point",
        dataSort: true,
        dataFormat: (point: number) => {
          if (point >= INF_POINT) {
            return <p>-</p>;
          } else {
            if (point % 100 == 0) {
              return <p>{point}</p>;
            } else {
              return <p>{point.toFixed(2)}</p>;
            }
          }
        }
      },
      {
        header: "Difficulty",
        dataField: "difficulty",
        dataSort: true,
        dataFormat: (difficulty: number) => {
          if (difficulty >= INF_POINT) {
            return <p>-</p>;
          } else {
            return <p>{difficulty}</p>;
          }
        }
      },
      {
        header: "Fastest",
        dataField: "executionTime",
        dataSort: true,
        dataFormat: (executionTime: number, row) => {
          const {
            fastest_submission_id,
            fastest_contest_id,
            fastest_user_id
          } = row.mergedProblem;
          if (fastest_submission_id && fastest_contest_id && fastest_user_id) {
            return (
              <a
                href={Url.formatSubmissionUrl(
                  fastest_submission_id,
                  fastest_contest_id
                )}
                target="_blank"
              >
                {fastest_user_id} ({executionTime} ms)
              </a>
            );
          } else {
            return <p />;
          }
        }
      },
      {
        header: "Shortest",
        dataField: "codeLength",
        dataSort: true,
        dataFormat: (codeLength: number, row) => {
          const {
            shortest_submission_id,
            shortest_contest_id,
            shortest_user_id
          } = row.mergedProblem;
          if (
            shortest_contest_id &&
            shortest_submission_id &&
            shortest_user_id
          ) {
            return (
              <a
                href={Url.formatSubmissionUrl(
                  shortest_submission_id,
                  shortest_contest_id
                )}
                target="_blank"
              >
                {shortest_user_id} ({codeLength} Bytes)
              </a>
            );
          } else {
            return <p />;
          }
        }
      },
      {
        header: "First",
        dataField: "firstUserId",
        dataSort: true,
        dataFormat: (_: string, row) => {
          const {
            first_submission_id,
            first_contest_id,
            first_user_id
          } = row.mergedProblem;
          if (first_submission_id && first_contest_id && first_user_id) {
            return (
              <a
                href={Url.formatSubmissionUrl(
                  first_submission_id,
                  first_contest_id
                )}
                target="_blank"
              >
                {first_user_id}
              </a>
            );
          } else {
            return <p />;
          }
        }
      },
      {
        header: "Shortest User for Search",
        dataField: "shortestUserId",
        hidden: true
      },
      {
        header: "Fastest User for Search",
        dataField: "fastestUserId",
        hidden: true
      }
    ];

    const points = mergedProblems
      .valueSeq()
      .map(p => p.point)
      .reduce((set, point) => (point ? set.add(point) : set), Set<number>())
      .toList()
      .sort();
    const difficulties = Range(0, 4400, 400)
      .map(from => ({
        from,
        to: from === 4000 ? INF_POINT : from + 399
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
            submissions={submissions}
            userIds={rivals.insert(0, userId)}
          />
        </Row>

        <Row className="my-2 border-bottom">
          <h1>Problem List</h1>
        </Row>
        <Row>
          <ButtonGroup className="mr-4">
            <UncontrolledButtonDropdown>
              <DropdownToggle caret>
                {this.state.fromPoint == 0
                  ? "Point From"
                  : this.state.fromPoint}
              </DropdownToggle>
              <DropdownMenu>
                {points.map(p => (
                  <DropdownItem
                    key={p}
                    onClick={() => this.setState({ fromPoint: p })}
                  >
                    {p}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledButtonDropdown>
            <UncontrolledButtonDropdown>
              <DropdownToggle caret>
                {this.state.toPoint == INF_POINT
                  ? "Point To"
                  : this.state.toPoint}
              </DropdownToggle>
              <DropdownMenu>
                {points.map(p => (
                  <DropdownItem
                    key={p}
                    onClick={() => this.setState({ toPoint: p })}
                  >
                    {p}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledButtonDropdown>
          </ButtonGroup>
          <ButtonGroup className="mr-4">
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {this.state.statusFilterState}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  onClick={() => this.setState({ statusFilterState: "All" })}
                >
                  All
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    this.setState({
                      statusFilterState: "Only Trying"
                    })
                  }
                >
                  Only Trying
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    this.setState({
                      statusFilterState: "Only AC"
                    })
                  }
                >
                  Only AC
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </ButtonGroup>
          <ButtonGroup className="mr-4">
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {this.state.ratedFilterState}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  onClick={() => this.setState({ ratedFilterState: "All" })}
                >
                  All
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    this.setState({ ratedFilterState: "Only Rated" })
                  }
                >
                  Only Rated
                </DropdownItem>
                <DropdownItem
                  onClick={() =>
                    this.setState({
                      ratedFilterState: "Only Unrated"
                    })
                  }
                >
                  Only Unrated
                </DropdownItem>
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
                    onClick={() => this.setState({ fromDifficulty: from })}
                  >
                    <DifficultyCircle
                      difficulty={to}
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
                    onClick={() => this.setState({ toDifficulty: to })}
                  >
                    <DifficultyCircle
                      difficulty={to}
                      id={`from-difficulty-dropdown-${to}`}
                    />
                    - {to < INF_POINT ? to : "inf"}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledButtonDropdown>
          </ButtonGroup>
        </Row>
        <Row>
          <BootstrapTable
            pagination
            keyField="id"
            height="auto"
            hover
            striped
            search
            trClassName={(row: ProblemRowData) => {
              const { status } = row;
              switch (status.label) {
                case StatusLabel.Success: {
                  return "table-success";
                }
                case StatusLabel.Failed: {
                  return "table-danger";
                }
                case StatusLabel.Warning: {
                  return "table-warning";
                }
                case StatusLabel.None: {
                  return "";
                }
              }
            }}
            data={rowData
              .filter(({ point }) => fromPoint <= point && point <= toPoint)
              .filter(row => {
                const { status } = row;
                switch (statusFilterState) {
                  case "All":
                    return true;
                  case "Only AC":
                    return status.label === StatusLabel.Success;
                  case "Only Trying":
                    return status.label !== StatusLabel.Success;
                }
              })
              .filter(row => {
                const isRated = !!row.mergedProblem.point;
                switch (ratedFilterState) {
                  case "All":
                    return true;
                  case "Only Rated":
                    return isRated;
                  case "Only Unrated":
                    return !isRated;
                }
              })
              .filter(
                ({ difficulty }) =>
                  fromDifficulty <= difficulty && difficulty <= toDifficulty
              )
              .toArray()}
            options={{
              paginationPosition: "top",
              sizePerPage: 20,
              sizePerPageList: [
                {
                  text: "20",
                  value: 20
                },
                {
                  text: "50",
                  value: 50
                },
                {
                  text: "100",
                  value: 100
                },
                {
                  text: "200",
                  value: 200
                },
                {
                  text: "All",
                  value: rowData.size
                }
              ]
            }}
          >
            {columns.map(c => (
              <TableHeaderColumn key={c.header} {...c}>
                {c.header}
              </TableHeaderColumn>
            ))}
          </BootstrapTable>
        </Row>
      </div>
    );
  }
}

interface Props {
  readonly userId: string;
  readonly rivals: List<string>;
  readonly submissions: Map<string, List<Submission>>;
  readonly mergedProblems: Map<string, MergedProblem>;
  readonly problemModels: Map<string, ProblemModel>;
  readonly contests: Map<string, Contest>;
  readonly statusLabelMap: Map<ProblemId, ProblemStatus>;

  readonly requestData: () => void;
}

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  rivals: state.users.rivals,
  submissions: state.submissions,
  mergedProblems: state.mergedProblems,
  contests: state.contests,
  statusLabelMap: state.cache.statusLabelMap,
  problemModels: state.problemModels
});

const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => {
    dispatch(requestMergedProblems());
  }
});

export default connect(
  stateToProps,
  dispatchToProps
)(ListPage);

import React, { ReactElement } from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import {
  Badge,
  Row,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";

import { isAccepted } from "../../utils";
import { formatDate } from "../../utils/DateFormat";
import * as Url from "../../utils/Url";
import MergedProblem from "../../interfaces/MergedProblem";
import Contest from "../../interfaces/Contest";
import Submission from "../../interfaces/Submission";
import SmallTable from "./SmallTable";
import ButtonGroup from "reactstrap/lib/ButtonGroup";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import State from "../../interfaces/State";
import { Set, List, Map } from "immutable";
import { requestMergedProblems, requestPerf } from "../../actions";

const INF_POINT = 1e18;

const ACCEPTED = "ACCEPTED";
const FAILED = "FAILED";
const TRYING = "TRYING";
const NONE = "NONE";

const getProblemStatus = (
  problemSubmissions: List<Submission>,
  userId: string,
  rivals: List<string>
) => {
  const userSubmissions = problemSubmissions
    .filter(s => s.user_id === userId)
    .sort((a, b) => a.epoch_second - b.epoch_second);
  const rivalsSubmissions = problemSubmissions
    .filter(s => rivals.contains(s.user_id))
    .filter(s => isAccepted(s.result));
  if (userSubmissions.find(s => isAccepted(s.result))) {
    return { status: ACCEPTED as typeof ACCEPTED };
  } else if (!rivalsSubmissions.isEmpty()) {
    return {
      status: FAILED as typeof FAILED,
      rivals: rivals
        .filter(r => rivalsSubmissions.find(s => s.user_id === r))
        .toList()
    };
  } else {
    const tail = userSubmissions.last(undefined);
    return tail
      ? { status: TRYING as typeof TRYING, result: tail.result }
      : { status: NONE as typeof NONE };
  }
};

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
  readonly status: ReturnType<typeof getProblemStatus>;
}

interface ListPageState {
  fromPoint: number;
  toPoint: number;
  statusFilterState: "All" | "Only Trying" | "Only AC";
  ratedFilterState: "All" | "Only Rated" | "Only Unrated";
}

class ListPage extends React.Component<Props, ListPageState> {
  constructor(props: any) {
    super(props);
    this.state = {
      fromPoint: 0,
      toPoint: INF_POINT,
      statusFilterState: "All",
      ratedFilterState: "All"
    };
  }

  componentDidMount(): void {
    this.props.requestData();
  }

  render() {
    const {
      mergedProblems,
      problemPerformances,
      submissions,
      userId,
      rivals,
      contests
    } = this.props;
    const {
      fromPoint,
      toPoint,
      ratedFilterState,
      statusFilterState
    } = this.state;
    const rowData = mergedProblems
      .valueSeq()
      .map(
        (p): ProblemRowData => {
          const contest = contests.get(p.contest_id);
          const contestDate = contest
            ? formatDate(contest.start_epoch_second)
            : "";
          const contestTitle = contest ? contest.title : "";

          const lastSubmission = submissions
            .get(p.id, List<Submission>())
            .filter(s => s.user_id === userId)
            .filter(s => isAccepted(s.result))
            .maxBy(s => s.epoch_second);
          const lastAcceptedDate = lastSubmission
            ? formatDate(lastSubmission.epoch_second)
            : "";
          const point = p.point ? p.point : p.predict ? p.predict : INF_POINT;
          const firstUserId = p.first_user_id ? p.first_user_id : "";
          const executionTime = p.execution_time ? p.execution_time : INF_POINT;
          const codeLength = p.source_code_length
            ? p.source_code_length
            : INF_POINT;
          const shortestUserId = p.shortest_user_id ? p.shortest_user_id : "";
          const fastestUserId = p.fastest_user_id ? p.fastest_user_id : "";

          return {
            id: p.id,
            title: p.title,
            contestDate,
            contestTitle,
            lastAcceptedDate,
            solverCount: p.solver_count ? p.solver_count : 0,
            point,
            difficulty: problemPerformances.get(p.id, INF_POINT),
            firstUserId,
            executionTime,
            codeLength,
            mergedProblem: p,
            shortestUserId,
            fastestUserId,
            status: getProblemStatus(
              submissions.get(p.id, List<Submission>()),
              userId,
              rivals
            )
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
          <a
            href={Url.formatProblemUrl(
              row.mergedProblem.id,
              row.mergedProblem.contest_id
            )}
            target="_blank"
          >
            {row.title}
          </a>
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
          switch (status.status) {
            case ACCEPTED: {
              return <Badge color="success">AC</Badge>;
            }
            case FAILED: {
              return (
                <div>
                  {status.rivals.map(rivalId => (
                    <Badge key={rivalId} color="danger">
                      {rivalId}
                    </Badge>
                  ))}
                </div>
              );
            }
            case TRYING: {
              return <Badge color="warning">{status.result}</Badge>;
            }
            case NONE: {
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
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {this.state.fromPoint == 0 ? "From" : this.state.fromPoint}
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
            </UncontrolledDropdown>
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {this.state.toPoint == INF_POINT ? "To" : this.state.toPoint}
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
            </UncontrolledDropdown>
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
              switch (status.status) {
                case ACCEPTED: {
                  return "table-success";
                }
                case FAILED: {
                  return "table-danger";
                }
                case TRYING: {
                  return "table-warning";
                }
                case NONE: {
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
                    return status.status === ACCEPTED;
                  case "Only Trying":
                    return status.status !== ACCEPTED;
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
                    return isRated;
                }
              })
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
  readonly problemPerformances: Map<string, number>;
  readonly contests: Map<string, Contest>;

  readonly requestData: () => void;
}

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  rivals: state.users.rivals,
  submissions: state.submissions,
  mergedProblems: state.mergedProblems,
  contests: state.contests,
  problemPerformances: state.problemPerformances
});

const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => {
    dispatch(requestMergedProblems());
    dispatch(requestPerf());
  }
});

export default connect(
  stateToProps,
  dispatchToProps
)(ListPage);

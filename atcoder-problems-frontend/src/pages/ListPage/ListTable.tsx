import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { StatusLabel } from "../../interfaces/Status";
import { Badge } from "reactstrap";
import React, { ReactElement } from "react";
import ProblemLink from "../../components/ProblemLink";
import ContestLink from "../../components/ContestLink";
import * as Url from "../../utils/Url";
import { INF_POINT, ProblemRowData } from "./index";
import { List } from "immutable";
import {
  formatPredictedSolveTime,
  predictSolveTime
} from "../../utils/ProblemModelUtil";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel
} from "../../interfaces/ProblemModel";
import { statusToTableColor } from "../../utils/TableColor";

interface Props {
  fromPoint: number;
  toPoint: number;
  statusFilterState: "All" | "Only Trying" | "Only AC";
  ratedFilterState: "All" | "Only Rated" | "Only Unrated";
  fromDifficulty: number;
  toDifficulty: number;
  rowData: List<ProblemRowData>;
  userInternalRating: number | null;
}

export const ListTable = (props: Props) => {
  const readDifficultyAsNumber: (row: ProblemRowData) => number = row => {
    const problemModel = row.problemModel;
    if (problemModel === undefined) {
      return -1;
    }
    if (!isProblemModelWithDifficultyModel(problemModel)) {
      return -1;
    }
    return problemModel.difficulty;
  };
  const predictSolveTimeOfRow: (row: ProblemRowData) => number | null = row => {
    if (props.userInternalRating === null) {
      return null;
    }
    const problemModel = row.problemModel;
    if (problemModel === undefined) {
      return null;
    }
    if (!isProblemModelWithTimeModel(problemModel)) {
      return null;
    }
    return predictSolveTime(problemModel, props.userInternalRating);
  };

  const columns: {
    header: string;
    dataField: string;
    dataSort?: boolean;
    dataAlign?: "center";
    dataFormat?: (cell: any, row: ProblemRowData) => ReactElement | string;
    hidden?: boolean;
    sortFunc?: (
      fieldA: ProblemRowData,
      fieldB: ProblemRowData,
      order: "asc" | "desc"
    ) => number;
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
            difficulty={
              isProblemModelWithDifficultyModel(row.problemModel)
                ? row.problemModel.difficulty
                : null
            }
            isExperimentalDifficulty={row.problemModel?.is_experimental}
            problemId={row.mergedProblem.id}
            problemTitle={row.title}
            contestId={row.mergedProblem.contest_id}
          />
        )
      },
      {
        header: "Contest",
        dataField: "contest",
        dataSort: true,
        dataFormat: (contest, row) =>
          contest ? (
            <ContestLink contest={contest} />
          ) : (
              <a
                href={Url.formatContestUrl(row.mergedProblem.contest_id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.contestTitle}
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
            rel="noopener noreferrer"
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
            if (point % 100 === 0) {
              return <p>{point}</p>;
            } else {
              return <p>{point.toFixed(2)}</p>;
            }
          }
        }
      },
      {
        header: "Difficulty",
        dataField: "problemModel",
        dataSort: true,
        sortFunc: (a, b, order) => {
          const delta = readDifficultyAsNumber(a) - readDifficultyAsNumber(b);
          const sign = order === "asc" ? 1 : -1;
          return delta * sign;
        },
        dataFormat: (problemModel: ProblemModel) => {
          if (!isProblemModelWithDifficultyModel(problemModel)) {
            return <p>-</p>;
          } else {
            return <p>{problemModel.difficulty}</p>;
          }
        }
      },
      {
        header: "Time",
        dataField: "a",
        dataSort: true,
        sortFunc: (a, b, order) => {
          const aPred = predictSolveTimeOfRow(a);
          const bPred = predictSolveTimeOfRow(b);
          const aV = aPred === null ? -1 : aPred;
          const bV = bPred === null ? -1 : bPred;
          const delta = aV - bV;
          const sign = order === "asc" ? 1 : -1;
          return delta * sign;
        },
        dataFormat: (_: string, row) => {
          const solveTime = predictSolveTimeOfRow(row);
          if (solveTime === null) {
            return <p>-</p>;
          }
          return <p>{formatPredictedSolveTime(solveTime)}</p>;
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
                rel="noopener noreferrer"
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
          if (shortest_contest_id && shortest_submission_id && shortest_user_id) {
            return (
              <a
                href={Url.formatSubmissionUrl(
                  shortest_submission_id,
                  shortest_contest_id
                )}
                target="_blank"
                rel="noopener noreferrer"
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
                rel="noopener noreferrer"
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

  return (
    <BootstrapTable
      pagination
      keyField="id"
      height="auto"
      hover
      striped
      search
      tableContainerClass="list-table"
      trClassName={(row: ProblemRowData) => {
        const { status, contest } = row;
        return statusToTableColor(status, contest);
      }}
      data={props.rowData
        .filter(
          row => props.fromPoint <= row.point && row.point <= props.toPoint
        ) // eslint-disable-next-line
        .filter(row => {
          switch (props.statusFilterState) {
            case "All":
              return true;
            case "Only AC":
              return row.status.label === StatusLabel.Success;
            case "Only Trying":
              return row.status.label !== StatusLabel.Success;
          }
        }) // eslint-disable-next-line
        .filter(row => {
          const isRated = !!row.mergedProblem.point;
          switch (props.ratedFilterState) {
            case "All":
              return true;
            case "Only Rated":
              return isRated;
            case "Only Unrated":
              return !isRated;
          }
        })
        .filter(row => {
          const difficulty = isProblemModelWithDifficultyModel(row.problemModel)
            ? row.problemModel.difficulty
            : -1;
          return (
            props.fromDifficulty <= difficulty &&
            difficulty <= props.toDifficulty
          );
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
            value: props.rowData.size
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
  );
};

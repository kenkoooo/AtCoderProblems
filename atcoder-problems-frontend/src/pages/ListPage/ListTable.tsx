import { Badge } from "reactstrap";
import React, { ReactElement } from "react";
import { List } from "immutable";
import { ColumnDescription } from "react-bootstrap-table-next";
import { StatusLabel } from "../../interfaces/Status";
import ProblemLink from "../../components/ProblemLink";
import ContestLink from "../../components/ContestLink";
import * as Url from "../../utils/Url";
import {
  formatPredictedSolveTime,
  predictSolveTime,
} from "../../utils/ProblemModelUtil";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
} from "../../interfaces/ProblemModel";
import { ColorMode, statusToTableColor } from "../../utils/TableColor";
// import { ListPaginationPanel } from "../../components/ListPaginationPanel";
import { ReactBootstrapTable } from "../../components/ReactBootstrapTable";
import { INF_POINT, ProblemRowData } from "./index";

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

export const ListTable: React.FC<Props> = (props) => {
  const readDifficultyAsNumber: (row: ProblemRowData) => number = (row) => {
    const problemModel = row.problemModel;
    if (problemModel === undefined) {
      return -1;
    }
    if (!isProblemModelWithDifficultyModel(problemModel)) {
      return -1;
    }
    return problemModel.difficulty;
  };
  const predictSolveTimeOfRow: (row: ProblemRowData) => number | null = (
    row
  ) => {
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

  const columns: ColumnDescription<ProblemRowData>[] = [
    {
      text: "Date",
      headerAlign: "left",
      dataField: "contestDate",
      sort: true,
    },
    {
      text: "Problem",
      headerAlign: "left",
      dataField: "title",
      sort: true,
      formatter: function DataFormat(_, row): React.ReactElement {
        return (
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
        );
      },
    },
    {
      text: "Contest",
      headerAlign: "left",
      dataField: "contest",
      sort: true,
      formatter: function DataFormat(contest, row): React.ReactElement {
        return contest ? (
          <ContestLink contest={contest} />
        ) : (
          <a
            href={Url.formatContestUrl(row.mergedProblem.contest_id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {row.contestTitle}
          </a>
        );
      },
    },
    {
      text: "Result",
      headerAlign: "left",
      dataField: "a",
      align: "center",
      formatter: (_: string, row): string | React.ReactElement => {
        const { status } = row;
        switch (status.label) {
          case StatusLabel.Success: {
            return <Badge color="success">AC</Badge>;
          }
          case StatusLabel.Failed: {
            return (
              <div>
                {Array.from(status.solvedRivals).map((rivalId) => (
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
      },
    },
    {
      text: "Last AC Date",
      headerAlign: "left",
      dataField: "lastAcceptedDate",
      sort: true,
    },
    {
      text: "Solvers",
      headerAlign: "left",
      dataField: "solverCount",
      sort: true,
      formatter: function DataFormat(
        solverCount: number,
        row
      ): React.ReactElement {
        return (
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
        );
      },
    },
    {
      text: "Point",
      headerAlign: "left",
      dataField: "point",
      sort: true,
      formatter: (point: number): React.ReactElement => {
        if (point >= INF_POINT) {
          return <p>-</p>;
        } else {
          if (point % 100 === 0) {
            return <p>{point}</p>;
          } else {
            return <p>{point.toFixed(2)}</p>;
          }
        }
      },
    },
    {
      text: "Difficulty",
      headerAlign: "left",
      dataField: "problemModel",
      sort: true,
      sortFunc: (a, b, order): number => {
        const delta = readDifficultyAsNumber(a) - readDifficultyAsNumber(b);
        const sign = order === "asc" ? 1 : -1;
        return delta * sign;
      },
      formatter: (problemModel: ProblemModel): React.ReactElement => {
        if (!isProblemModelWithDifficultyModel(problemModel)) {
          return <p>-</p>;
        } else {
          return <p>{problemModel.difficulty}</p>;
        }
      },
    },
    {
      text: "Time",
      headerAlign: "left",
      dataField: "time",
      sort: true,
      sortFunc: (a, b, order): number => {
        const aPred = predictSolveTimeOfRow(a);
        const bPred = predictSolveTimeOfRow(b);
        const aV = aPred === null ? -1 : aPred;
        const bV = bPred === null ? -1 : bPred;
        const delta = aV - bV;
        const sign = order === "asc" ? 1 : -1;
        return delta * sign;
      },
      formatter: function DataFormat(_: string, row): React.ReactElement {
        const solveTime = predictSolveTimeOfRow(row);
        if (solveTime === null) {
          return <p>-</p>;
        }
        return <p>{formatPredictedSolveTime(solveTime)}</p>;
      },
    },
    {
      text: "Fastest",
      headerAlign: "left",
      dataField: "executionTime",
      sort: true,
      formatter: (executionTime: number, row): React.ReactElement => {
        const {
          fastest_submission_id,
          fastest_contest_id,
          fastest_user_id,
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
      },
    },
    {
      text: "Shortest",
      headerAlign: "left",
      dataField: "codeLength",
      sort: true,
      formatter: (codeLength: number, row): React.ReactElement => {
        const {
          shortest_submission_id,
          shortest_contest_id,
          shortest_user_id,
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
      },
    },
    {
      text: "First",
      headerAlign: "left",
      dataField: "firstUserId",
      sort: true,
      formatter: (_: string, row): React.ReactElement => {
        const {
          first_submission_id,
          first_contest_id,
          first_user_id,
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
      },
    },
    {
      text: "Shortest User for Search",
      dataField: "shortestUserId",
      hidden: true,
    },
    {
      text: "Fastest User for Search",
      dataField: "fastestUserId",
      hidden: true,
    },
    {
      text: "Contest name for Search",
      dataField: "contestTitle",
      hidden: true,
    },
  ];

  return (
    <ReactBootstrapTable
      keyField="id"
      columns={columns}
      hover
      striped
      sizePerPage={20}
      wrapperClasses="list-table"
      useSearch
      usePagination
      useBinaryPagination
      rowClasses={(row: ProblemRowData): string => {
        const { status, contest } = row;
        return statusToTableColor({
          colorMode: ColorMode.ContestResult,
          status,
          contest,
        });
      }}
      data={props.rowData
        .filter(
          (row) => props.fromPoint <= row.point && row.point <= props.toPoint
        ) // eslint-disable-next-line
        .filter((row) => {
          switch (props.statusFilterState) {
            case "All":
              return true;
            case "Only AC":
              return row.status.label === StatusLabel.Success;
            case "Only Trying":
              return row.status.label !== StatusLabel.Success;
          }
        }) // eslint-disable-next-line
        .filter((row) => {
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
        .filter((row) => {
          const difficulty = isProblemModelWithDifficultyModel(row.problemModel)
            ? row.problemModel.difficulty
            : -1;
          return (
            props.fromDifficulty <= difficulty &&
            difficulty <= props.toDifficulty
          );
        })
        .toArray()}
    />
  );
};

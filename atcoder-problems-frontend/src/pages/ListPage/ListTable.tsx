import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Badge } from "reactstrap";
import React, { ReactElement } from "react";
import { List } from "immutable";
import * as Url from "../../utils/Url";
import { ContestLink } from "../../components/ContestLink";
import { ProblemLink } from "../../components/ProblemLink";
import { StatusLabel } from "../../interfaces/Status";
import {
  formatPredictedSolveTime,
  formatPredictedSolveProbability,
  predictSolveTime,
  predictSolveProbability,
} from "../../utils/ProblemModelUtil";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
} from "../../interfaces/ProblemModel";
import { ColorMode, statusToTableColor } from "../../utils/TableColor";
import { ListPaginationPanel } from "../../components/ListPaginationPanel";
import { RatingInfo } from "../../utils/RatingInfo";
import { INF_POINT, ProblemRowData } from "./index";

interface Props {
  fromPoint: number;
  toPoint: number;
  statusFilterState: "All" | "Only Trying" | "Only AC";
  ratedFilterState:
    | "All"
    | "Only Rated"
    | "Only Unrated"
    | "Only Unrated without Difficulty";
  fromDifficulty: number;
  toDifficulty: number;
  rowData: List<ProblemRowData>;
  userRatingInfo: RatingInfo | null;
}

export const ListTable: React.FC<Props> = (props) => {
  const userInternalRating = props.userRatingInfo?.internalRating ?? null;
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
    if (userInternalRating === null) {
      return null;
    }
    const problemModel = row.problemModel;
    if (problemModel === undefined) {
      return null;
    }
    if (!isProblemModelWithTimeModel(problemModel)) {
      return null;
    }
    return predictSolveTime(problemModel, userInternalRating);
  };
  const predictSolveProbabilityOfRow: (row: ProblemRowData) => number | null = (
    row
  ) => {
    if (userInternalRating === null) {
      return null;
    }
    const problemModel = row.problemModel;
    if (problemModel === undefined) {
      return null;
    }
    if (!isProblemModelWithDifficultyModel(problemModel)) {
      return null;
    }
    return predictSolveProbability(problemModel, userInternalRating);
  };

  const columns: {
    header: string;
    dataField: string;
    dataSort?: boolean;
    dataAlign?: "center";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      dataSort: true,
    },
    {
      header: "Problem",
      dataField: "title",
      dataSort: true,
      dataFormat: function DataFormat(_, row): React.ReactElement {
        return (
          <ProblemLink
            showDifficulty={true}
            isExperimentalDifficulty={row.problemModel?.is_experimental}
            problemId={row.mergedProblem.id}
            problemTitle={row.title}
            contestId={row.mergedProblem.contest_id}
            problemModel={row.problemModel}
            userRatingInfo={props.userRatingInfo}
          />
        );
      },
    },
    {
      header: "Contest",
      dataField: "contest",
      dataSort: true,
      dataFormat: function DataFormat(contest, row): React.ReactElement {
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
      header: "Result",
      dataField: "a",
      dataAlign: "center",
      dataFormat: (_: string, row): string | React.ReactElement => {
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
      header: "Last AC Date",
      dataField: "lastAcceptedDate",
      dataSort: true,
    },
    {
      header: "Solvers",
      dataField: "solverCount",
      dataSort: true,
      dataFormat: function DataFormat(
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
      header: "Point",
      dataField: "point",
      dataSort: true,
      dataFormat: (point: number): React.ReactElement => {
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
      header: "Difficulty",
      dataField: "problemModel",
      dataSort: true,
      sortFunc: (a, b, order): number => {
        const delta = readDifficultyAsNumber(a) - readDifficultyAsNumber(b);
        const sign = order === "asc" ? 1 : -1;
        return delta * sign;
      },
      dataFormat: (problemModel: ProblemModel): React.ReactElement => {
        if (!isProblemModelWithDifficultyModel(problemModel)) {
          return <p>-</p>;
        } else {
          return <p>{problemModel.difficulty}</p>;
        }
      },
    },
    {
      header: "Solve Prob",
      dataField: "prob",
      dataSort: true,
      sortFunc: (a, b, order): number => {
        const aPred = predictSolveProbabilityOfRow(a);
        const bPred = predictSolveProbabilityOfRow(b);
        const aV = aPred === null ? -1 : aPred;
        const bV = bPred === null ? -1 : bPred;
        const delta = aV - bV;
        const sign = order === "asc" ? 1 : -1;
        return delta * sign;
      },
      dataFormat: function DataFormat(_: string, row): React.ReactElement {
        const solveProb = predictSolveProbabilityOfRow(row);
        if (solveProb === null) {
          return <p>-</p>;
        }
        return <p>{formatPredictedSolveProbability(solveProb)}</p>;
      },
    },
    {
      header: "Time",
      dataField: "a",
      dataSort: true,
      sortFunc: (a, b, order): number => {
        const aPred = predictSolveTimeOfRow(a);
        const bPred = predictSolveTimeOfRow(b);
        const aV = aPred === null ? -1 : aPred;
        const bV = bPred === null ? -1 : bPred;
        const delta = aV - bV;
        const sign = order === "asc" ? 1 : -1;
        return delta * sign;
      },
      dataFormat: function DataFormat(_: string, row): React.ReactElement {
        const solveTime = predictSolveTimeOfRow(row);
        if (solveTime === null) {
          return <p>-</p>;
        }
        return <p>{formatPredictedSolveTime(solveTime)}</p>;
      },
    },
    {
      header: "Fastest",
      dataField: "executionTime",
      dataSort: true,
      dataFormat: (executionTime: number, row): React.ReactElement => {
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
      header: "Shortest",
      dataField: "codeLength",
      dataSort: true,
      dataFormat: (codeLength: number, row): React.ReactElement => {
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
      header: "First",
      dataField: "firstUserId",
      dataSort: true,
      dataFormat: (_: string, row): React.ReactElement => {
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
      header: "Shortest User for Search",
      dataField: "shortestUserId",
      hidden: true,
    },
    {
      header: "Fastest User for Search",
      dataField: "fastestUserId",
      hidden: true,
    },
    {
      header: "Contest name for Search",
      dataField: "contestTitle",
      hidden: true,
    },
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
      trClassName={(row: ProblemRowData): string => {
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
          const hasDifficulty = isProblemModelWithDifficultyModel(
            row.problemModel
          );
          switch (props.ratedFilterState) {
            case "All":
              return true;
            case "Only Rated":
              return isRated;
            case "Only Unrated":
              return !isRated;
            case "Only Unrated without Difficulty":
              return !isRated && !hasDifficulty;
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
      options={{
        paginationPosition: "top",
        sizePerPage: 20,
        sizePerPageList: [
          {
            text: "20",
            value: 20,
          },
          {
            text: "50",
            value: 50,
          },
          {
            text: "100",
            value: 100,
          },
          {
            text: "200",
            value: 200,
          },
          {
            text: "All",
            value: props.rowData.size,
          },
        ],
        paginationPanel: function DataFormat(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paginationPanelProps: any
        ): React.ReactElement {
          return <ListPaginationPanel {...paginationPanelProps} />;
        },
      }}
    >
      {columns.map((c) => (
        <TableHeaderColumn
          key={c.header}
          tdAttr={{ "data-col-name": c.header }}
          {...c}
        >
          {c.header}
        </TableHeaderColumn>
      ))}
    </BootstrapTable>
  );
};

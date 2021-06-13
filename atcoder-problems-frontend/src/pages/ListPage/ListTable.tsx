import {
  BootstrapTable,
  Options,
  SelectRow,
  TableHeaderColumn,
} from "react-bootstrap-table";
import { Badge } from "reactstrap";
import React, { ReactElement } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Contest from "../../interfaces/Contest";
import {
  constructStatusLabelMap,
  noneStatus,
  ProblemId,
  ProblemStatus,
  StatusLabel,
} from "../../interfaces/Status";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
} from "../../interfaces/ProblemModel";
import MergedProblem from "../../interfaces/MergedProblem";
import Submission from "../../interfaces/Submission";
import * as Url from "../../utils/Url";
import {
  formatPredictedSolveTime,
  formatPredictedSolveProbability,
  predictSolveTime,
  predictSolveProbability,
} from "../../utils/ProblemModelUtil";
import { ColorMode, statusToTableColor } from "../../utils/TableColor";
import { formatMomentDate, parseSecond } from "../../utils/DateUtil";
import { ContestLink } from "../../components/ContestLink";
import { ProblemLink } from "../../components/ProblemLink";
import {
  ListPaginationPanel,
  ListPaginationPanelProps,
} from "../../components/ListPaginationPanel";
import {
  useContestMap,
  useMergedProblemMap,
  useProblemModelMap,
  useRatingInfo,
} from "../../api/APIClient";

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

export type ProblemRowDataField =
  | keyof ProblemRowData
  | "solveProbability"
  | "timeEstimation";

export const statusFilters = [
  "All",
  "Only Trying",
  "Only AC",
  "AC during Contest",
  "AC after Contest",
] as const;
export type StatusFilter = typeof statusFilters[number];

const convertSortByParam = (value: string | null): ProblemRowDataField => {
  return (
    ([
      "id",
      "title",
      "contest",
      "contestDate",
      "contestTitle",
      "lastAcceptedDate",
      "solverCount",
      "point",
      "problemModel",
      "firstUserId",
      "executionTime",
      "codeLength",
      "mergedProblem",
      "shortestUserId",
      "fastestUserId",
      "status",
      "solveProbability",
      "timeEstimation",
    ] as const).find((v) => v === value) ?? "contestDate"
  );
};

interface Props {
  userId: string;
  fromPoint: number;
  toPoint: number;
  statusFilterState: StatusFilter;
  ratedFilterState:
    | "All"
    | "Only Rated"
    | "Only Unrated"
    | "Only Unrated without Difficulty";
  fromDifficulty: number;
  toDifficulty: number;
  filteredSubmissions: Submission[];
  selectRow?: SelectRow;
  selectLanguage: string;
}

export const ListTable: React.FC<Props> = (props) => {
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const sortBy = convertSortByParam(searchParams.get("sortBy"));
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const mergedProblemMap =
    useMergedProblemMap().data ?? new Map<ProblemId, MergedProblem>();
  const problemModels = useProblemModelMap();

  const { userId, filteredSubmissions } = props;

  const contestMap = useContestMap();
  const statusLabelMap = constructStatusLabelMap(filteredSubmissions, userId);
  const rowData = Array.from(mergedProblemMap.values())
    .map(
      (p: MergedProblem): ProblemRowData => {
        const contest = contestMap?.get(p.contest_id);
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
        const problemModel = problemModels?.get(p.id);
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
    });

  const userRatingInfo = useRatingInfo(props.userId);
  const userInternalRating = userRatingInfo.internalRating;
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
    dataField: ProblemRowDataField;
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
            userRatingInfo={userRatingInfo}
          />
        );
      },
    },
    {
      header: "Contest",
      dataField: "contest",
      dataSort: true,
      dataFormat: function DataFormat(
        contest: Contest | undefined,
        row
      ): React.ReactElement {
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
      dataField: "status",
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
      dataField: "solveProbability",
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
      dataField: "timeEstimation",
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: Options<{ [key in ProblemRowDataField]: any }> = {
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
        value: rowData.length,
      },
    ],
    paginationPanel: function DataFormat(
      paginationPanelProps: ListPaginationPanelProps
    ): React.ReactElement {
      return <ListPaginationPanel {...paginationPanelProps} />;
    },
    defaultSortName: sortBy,
    defaultSortOrder: sortOrder,
    onSortChange: function (
      sortName: ProblemRowDataField,
      sortOrder: "asc" | "desc"
    ): void {
      const params = new URLSearchParams(location.search);
      params.set("sortBy", sortName);
      params.set("sortOrder", sortOrder);
      history.push({ ...location, search: params.toString() });
    },
  };

  return (
    <BootstrapTable
      pagination
      keyField="id"
      height="auto"
      hover
      striped
      search
      selectRow={props.selectRow}
      tableContainerClass="list-table"
      trClassName={(row: ProblemRowData): string => {
        const { status, contest } = row;
        return statusToTableColor({
          colorMode: ColorMode.ContestResult,
          status,
          contest,
        });
      }}
      data={rowData
        .filter(
          (row) => props.fromPoint <= row.point && row.point <= props.toPoint
        ) // eslint-disable-next-line
        .filter((row) => {
          const { status, contest } = row;
          const isSuccess = status.label === StatusLabel.Success;
          const isSubmittedInContest =
            status.label === StatusLabel.Success &&
            contest !== undefined &&
            status.epoch < contest.start_epoch_second + contest.duration_second;
          switch (props.statusFilterState) {
            case "All":
              return true;
            case "Only AC":
              return isSuccess;
            case "Only Trying":
              return !isSuccess;
            case "AC during Contest":
              return isSuccess && isSubmittedInContest;
            case "AC after Contest":
              return isSuccess && !isSubmittedInContest;
          }
        }) // eslint-disable-next-line
        .filter((row) => {
          const status = row.status;
          const selectedLanguage = props.selectLanguage;
          if (props.selectLanguage === "All") {
            return true;
          } else {
            switch (status.label) {
              case StatusLabel.Success:
                return status.solvedLanguages.has(selectedLanguage);
              case StatusLabel.Warning:
                return status.submittedLanguages.has(selectedLanguage);
              default:
                return false;
            }
          }
        })
        .filter((row): boolean => {
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
        })}
      options={options}
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

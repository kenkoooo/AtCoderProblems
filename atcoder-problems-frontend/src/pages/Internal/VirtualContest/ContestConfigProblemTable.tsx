import React, { ReactElement } from "react";
import { Button, Input, InputGroup, ButtonGroup } from "reactstrap";
import Octicon, { ChevronUp, ChevronDown } from "@primer/octicons-react";
import {
  BootstrapTable,
  TableHeaderColumn,
  Options,
  CellEdit,
  CustomEditor,
  CustomEditorProps,
} from "react-bootstrap-table";
import * as Url from "../../../utils/Url";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
} from "../../../interfaces/ProblemModel";
import { ContestLink } from "../../../components/ContestLink";
import { ProblemLink } from "../../../components/ProblemLink";
import {
  useMultipleUserSubmissions,
  useProblemMap,
  useProblemModelMap,
  useContestMap,
} from "../../../api/APIClient";
import { ProblemId, UserId } from "../../../interfaces/Status";
import { VirtualContestItem } from "../types";
import { isAccepted } from "../../../utils";
import Problem from "../../../interfaces/Problem";
import Contest from "../../../interfaces/Contest";

export interface ProblemRowData {
  readonly index: number;
  readonly id: string;
  readonly point: number | null;
  readonly order: number | null;
  readonly problem?: Problem;
  readonly contest?: Contest;
  readonly problemModel?: ProblemModel;
  readonly solvedUsers?: string[];
}

export type ProblemRowDataField = keyof ProblemRowData | "swap";

interface Props {
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
  expectedParticipantUserIds: string[];
  onSolvedProblemsFetchFinished: (errorMessage?: string | null) => void;
}

export const ContestConfigProblemTable: React.FC<Props> = (props) => {
  const { problemSet, setProblemSet } = props;
  const problemMap = useProblemMap();
  const problemModels = useProblemModelMap();
  const solvedProblemIdsByUser = (
    useMultipleUserSubmissions(props.expectedParticipantUserIds).data ?? []
  )
    .filter((submission) => isAccepted(submission.result))
    .reduce((map, submission) => {
      const userId = submission.user_id;
      const problemIds = map.get(userId) ?? new Set<ProblemId>();
      problemIds.add(submission.problem_id);
      map.set(userId, problemIds);
      return map;
    }, new Map<UserId, Set<ProblemId>>());

  const contestMap = useContestMap();
  const rowData: ProblemRowData[] = Array.from(problemSet.values()).map(
    (p: VirtualContestItem, index): ProblemRowData => {
      const problemModel = problemModels?.get(p.id);
      const problem = problemMap?.get(p.id);
      const contest = problem ? contestMap?.get(problem.contest_id) : undefined;
      const solvedUsers = problem
        ? Array.from(solvedProblemIdsByUser)
            .filter(([, problemIds]) => problemIds.has(problem.id))
            .map(([user]) => user)
        : [];
      return {
        index,
        id: p.id,
        point: p.point,
        order: p.order,
        problemModel,
        problem,
        contest,
        solvedUsers,
      };
    }
  );
  const columns: {
    header: string;
    dataField: ProblemRowDataField;
    width?: string;
    dataSort?: boolean;
    customEditor?: CustomEditor<ProblemRowData, keyof ProblemRowData>;
    editable: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataFormat?: (cell: any, row: ProblemRowData) => ReactElement | string;
    sortFunc?: (
      fieldA: ProblemRowData,
      fieldB: ProblemRowData,
      order: "asc" | "desc"
    ) => number;
  }[] = [
    {
      header: "Problem",
      dataField: "problem",
      editable: false,
      dataFormat: function DataFormat(_, row): ReactElement {
        return (
          <>
            {row.problem ? (
              <ProblemLink
                problemId={row.problem.id}
                contestId={row.problem.contest_id}
                problemTitle={row.problem.title}
                showDifficulty={true}
                problemModel={row.problemModel}
                isExperimentalDifficulty={row.problemModel?.is_experimental}
              />
            ) : (
              row.id
            )}
            {row.solvedUsers && row.solvedUsers.length > 0 && (
              <> solved by {row.solvedUsers.join(", ")}</>
            )}
          </>
        );
      },
    },
    {
      header: "Contest",
      dataField: "contest",
      editable: false,
      dataFormat: function DataFormat(
        contest: Contest | undefined,
        row: ProblemRowData
      ): ReactElement {
        return contest ? (
          <ContestLink contest={contest} />
        ) : (
          <>
            {row.problem ? (
              <a
                href={Url.formatContestUrl(row.problem.contest_id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.problem.title}
              </a>
            ) : null}
          </>
        );
      },
    },
    {
      header: "Difficulty (sortable)",
      dataField: "problemModel",
      editable: false,
      dataSort: true,
      width: "150px",
      sortFunc: (a, b): number => {
        return a.index - b.index;
      },
      dataFormat: (problemModel: ProblemModel): ReactElement => {
        if (!isProblemModelWithDifficultyModel(problemModel)) {
          return <>-</>;
        } else {
          return <>{problemModel.difficulty}</>;
        }
      },
    },
    {
      header: "Point (editable)",
      dataField: "point",
      dataSort: false,
      editable: true,
      width: "150px",
      customEditor: {
        getElement(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onUpdate: (updatedCell: any) => void,
          props: CustomEditorProps<ProblemRowData, keyof ProblemRowData>
        ): ReactElement {
          // TODO monkukui: これは取り除きたい
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const { row, onKeyDown, onBlur } = props;
          return (
            <InputGroup size="sm">
              <Input
                type="number"
                autoFocus={true}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                defaultValue={row.point ? row.point : undefined}
                onChange={(e): void => {
                  const parse = parseInt(e.target.value, 10);
                  const point = !isNaN(parse) ? parse : null;
                  const newProblemSet = [...problemSet];
                  newProblemSet[row.index] = {
                    ...problemSet[row.index],
                    point,
                  };
                  setProblemSet(newProblemSet);
                }}
              />
            </InputGroup>
          );
        },
      },
      dataFormat: function DataFormat(_, row): ReactElement {
        if (row.point === null) {
          return <>-</>;
        }
        return <>{row.point}</>;
      },
    },
    {
      header: "Setting",
      dataField: "swap",
      editable: false,
      width: "120px",
      dataFormat: function DataFormat(_, row): ReactElement {
        return (
          <>
            <Button
              close
              style={{ marginRight: "1rem" }}
              onClick={(): void => {
                setProblemSet(problemSet.filter((x) => x.id !== row.id));
              }}
            />
            <ButtonGroup size="sm" style={{ marginRight: "1rem" }}>
              <Button
                disabled={row.index === 0}
                onClick={(): void => {
                  const nextFirst = problemSet[row.index];
                  const nextSecond = problemSet[row.index - 1];
                  if (nextFirst && nextSecond) {
                    const newProblemSet = [...problemSet];
                    newProblemSet[row.index - 1] = nextFirst;
                    newProblemSet[row.index] = nextSecond;
                    setProblemSet(newProblemSet);
                  }
                }}
              >
                <Octicon icon={ChevronUp} />
              </Button>
              <Button
                disabled={row.index === problemSet.length - 1}
                onClick={(): void => {
                  const nextFirst = problemSet[row.index + 1];
                  const nextSecond = problemSet[row.index];
                  if (nextFirst && nextSecond) {
                    const newProblemSet = [...problemSet];
                    newProblemSet[row.index] = nextFirst;
                    newProblemSet[row.index + 1] = nextSecond;
                    setProblemSet(newProblemSet);
                  }
                }}
              >
                <Octicon icon={ChevronDown} />
              </Button>
            </ButtonGroup>
          </>
        );
      },
    },
  ];
  const getDifficultyByIndex = (i: number): number => {
    const problemModel = problemModels?.get(problemSet[i].id);
    const difficulty = problemModel?.difficulty ? problemModel?.difficulty : 0;
    return difficulty;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: Options<{ [key in ProblemRowDataField]: any }> = {
    noDataText:
      "You have not added any problems yet. Use the search box below to search for problems to add to the contest.",
    onSortChange: (sortName: string, sortOrder: string) => {
      const newProblemSet = [...problemSet];
      const p = [];
      for (let i = 0; i < problemSet.length; i++) {
        p.push(i);
      }
      p.sort(function (a, b) {
        const aD = getDifficultyByIndex(a);
        const bD = getDifficultyByIndex(b);
        const delta = aD - bD;
        const sign = sortOrder === "asc" ? -1 : 1;
        return delta * sign;
      });

      for (let i = 0; i < problemSet.length; i++) {
        newProblemSet[i] = problemSet[p[i]];
      }
      setProblemSet(newProblemSet);
    },
  };
  const cellEdit: CellEdit = {
    mode: "click",
    blurToEscape: true,
  };
  return (
    <>
      <h5 className="m-6">Selected {problemSet.length} Problem</h5>
      <BootstrapTable
        keyField="id"
        tableContainerClass="list-table"
        striped
        data={rowData}
        options={options}
        cellEdit={cellEdit}
        hover={true}
        maxHeight="500"
        trStyle={(row: ProblemRowData): React.CSSProperties => {
          return row && row.solvedUsers && row.solvedUsers.length > 0
            ? { backgroundColor: "#ffeeee" }
            : {};
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
    </>
  );
};

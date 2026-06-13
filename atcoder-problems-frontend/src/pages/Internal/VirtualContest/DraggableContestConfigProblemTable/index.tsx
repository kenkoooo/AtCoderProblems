import React from "react";
import { ListGroup, ListGroupItem, Table } from "reactstrap";

import {
  DragDropContext,
  DropResult,
  Droppable,
  Draggable,
  DraggingStyle,
  NotDraggingStyle,
} from "react-beautiful-dnd";

import ProblemModel from "../../../../interfaces/ProblemModel";
import {
  useMultipleUserSubmissions,
  useProblemMap,
  useProblemModelMap,
  useContestMap,
} from "../../../../api/APIClient";
import { ProblemId, UserId } from "../../../../interfaces/Status";
import { VirtualContestItem } from "../../types";
import { isAccepted } from "../../../../utils";
import Problem from "../../../../interfaces/Problem";
import Contest from "../../../../interfaces/Contest";
import { ProblemCell } from "./ProblemCell";
import { ContestCell } from "./ContestCell";
import { PointCell } from "./PointCell";
import { DifficultyCell } from "./DifficultyCell";
import { DeleteCell } from "./DeleteCell";
import { TableHeader } from "./TableHeader";

export interface ProblemHeaderData {
  readonly text: string;
  readonly compare?: (a: VirtualContestItem, b: VirtualContestItem) => number;
}

export interface ProblemRowData {
  readonly index: number;
  readonly id: ProblemId;
  readonly point: number | null;
  readonly order: number | null;
  readonly problem?: Problem;
  readonly contest?: Contest;
  readonly problemModel?: ProblemModel;
  readonly solvedUsers?: string[];
}

export interface Props {
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
  expectedParticipantUserIds: string[];
  onSolvedProblemsFetchFinished: (errorMessage?: string | null) => void;
}

export const DraggableContestConfigProblemTable: React.FC<Props> = (props) => {
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
  const [sortedColumn, setSortedColumn] = React.useState<string | null>(null);

  if (problemSet.length === 0) {
    return (
      <ListGroup>
        <ListGroupItem>
          You have not added any problems yet. Use the search box below to
          search for problems to add to the contest.
        </ListGroupItem>
      </ListGroup>
    );
  }

  const headerData: ProblemHeaderData[] = [
    {
      text: "Problem",
      compare: (a: VirtualContestItem, b: VirtualContestItem): number => {
        const getTitle = (problemId: ProblemId): string => {
          const problem = problemMap?.get(problemId);
          const title = `${problem?.problem_index ?? ""}. ${
            problem?.name ?? ""
          }`;
          return title;
        };
        const aTitle = getTitle(a.id);
        const bTitle = getTitle(b.id);
        return aTitle < bTitle ? -1 : 1;
      },
    },
    {
      text: "Contest",
      compare: (a: VirtualContestItem, b: VirtualContestItem): number => {
        const getTitle = (problemId: ProblemId): string => {
          const problem = problemMap?.get(problemId);
          const contest = problem
            ? contestMap?.get(problem.contest_id)
            : undefined;
          const title = contest?.title ? contest.title : "";
          return title;
        };
        const aTitle = getTitle(a.id);
        const bTitle = getTitle(b.id);
        return aTitle < bTitle ? -1 : 1;
      },
    },
    {
      text: "Difficulty",
      compare: (a: VirtualContestItem, b: VirtualContestItem): number => {
        const getDifficulty = (problemId: ProblemId): number => {
          const problemModel = problemModels?.get(problemId);
          const difficulty =
            problemModel?.difficulty !== undefined
              ? problemModel.difficulty
              : -Infinity;
          return difficulty;
        };
        const aDifficulty = getDifficulty(a.id);
        const bDifficulty = getDifficulty(b.id);
        return aDifficulty - bDifficulty;
      },
    },
    {
      text: "Point",
      compare: (a: VirtualContestItem, b: VirtualContestItem): number => {
        const aPoint = a.point !== null ? a.point : -Infinity;
        const bPoint = b.point !== null ? b.point : -Infinity;
        return aPoint - bPoint;
      },
    },
    {
      text: "",
    },
  ];
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

  const reorder = (
    problemSet: VirtualContestItem[],
    startIndex: number,
    endIndex: number
  ) => {
    const result = Array.from(problemSet);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };
  const onDragEnd = (result: DropResult): void => {
    if (!result.destination) {
      return;
    }
    const newProblemSet = reorder(
      problemSet,
      result.source.index,
      result.destination.index
    );
    setProblemSet(newProblemSet);
  };
  const getItemStyle = (
    row: ProblemRowData,
    isDragging: boolean,
    draggableStyle?: DraggingStyle | NotDraggingStyle
  ): React.CSSProperties => ({
    userSelect: "none",
    background: isDragging
      ? "lightgreen"
      : row && row.solvedUsers && row.solvedUsers.length > 0
      ? "#ffeeee"
      : "",
    ...draggableStyle,
  });
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <div
            /* eslint-disable-next-line @typescript-eslint/unbound-method */
            ref={provided.innerRef}
            style={{ fontSize: "80%" }}
          >
            <Table hover bordered responsive size="sm">
              <thead>
                <tr>
                  {headerData.map((header, index) => (
                    <TableHeader
                      key={index}
                      problemSet={problemSet}
                      setProblemSet={setProblemSet}
                      text={header.text}
                      compare={header.compare}
                      isSorted={sortedColumn === header.text}
                      setSortedColumn={setSortedColumn}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowData.map((row, index) => (
                  <Draggable key={row.id} draggableId={row.id} index={index}>
                    {(provided, snapshot) => (
                      <tr
                        /* eslint-disable-next-line @typescript-eslint/unbound-method */
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                          row,
                          snapshot.isDragging,
                          provided.draggableProps.style
                        )}
                      >
                        <ProblemCell
                          problemId={row.id}
                          problem={row.problem}
                          problemModel={row.problemModel}
                          solvedUsers={row.solvedUsers}
                        />
                        <ContestCell contest={row.contest} />
                        <DifficultyCell problemModel={row.problemModel} />
                        <PointCell
                          currentPoint={row.point}
                          setProblemPoint={(point: number | null) => {
                            const newProblemSet = [...problemSet];
                            newProblemSet[row.index] = {
                              ...problemSet[row.index],
                              point,
                            };
                            setProblemSet(newProblemSet);
                          }}
                        />
                        <DeleteCell
                          onDelete={() => {
                            setProblemSet(
                              problemSet.filter((x) => x.id !== row.id)
                            );
                          }}
                        />
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            </Table>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

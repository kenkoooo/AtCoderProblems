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
  readonly less?: (a: VirtualContestItem, b: VirtualContestItem) => number;
}

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
      less: (a: VirtualContestItem, b: VirtualContestItem): number => {
        const aProblem = problemMap?.get(a.id);
        const bProblem = problemMap?.get(b.id);
        const aTitle = aProblem?.title ? aProblem.title : "";
        const bTitle = bProblem?.title ? bProblem.title : "";
        return aTitle < bTitle ? -1 : 1;
      },
    },
    {
      text: "Contest",
      less: (a: VirtualContestItem, b: VirtualContestItem): number => {
        const aProblem = problemMap?.get(a.id);
        const bProblem = problemMap?.get(b.id);
        const aContest = aProblem
          ? contestMap?.get(aProblem.contest_id)
          : undefined;
        const bContest = bProblem
          ? contestMap?.get(bProblem.contest_id)
          : undefined;
        const aTitle = aContest?.title ? aContest.title : "";
        const bTitle = bContest?.title ? bContest.title : "";
        return aTitle < bTitle ? -1 : 1;
      },
    },
    {
      text: "Difficulty",
      less: (a: VirtualContestItem, b: VirtualContestItem): number => {
        const aProblemModel = problemModels?.get(a.id);
        const bProblemModel = problemModels?.get(b.id);
        const aDifficulty =
          aProblemModel?.difficulty !== undefined
            ? aProblemModel.difficulty
            : -Infinity;
        const bDifficulty =
          bProblemModel?.difficulty !== undefined
            ? bProblemModel.difficulty
            : -Infinity;
        return aDifficulty - bDifficulty;
      },
    },
    {
      text: "Point",
      less: (a: VirtualContestItem, b: VirtualContestItem): number => {
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
                      less={header.less}
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
                          index={row.index}
                          point={row.point}
                          problemSet={props.problemSet}
                          setProblemSet={props.setProblemSet}
                        />
                        <DeleteCell
                          problemId={row.id}
                          problemSet={props.problemSet}
                          setProblemSet={props.setProblemSet}
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

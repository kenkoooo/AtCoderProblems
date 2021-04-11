import { useCallback, useReducer } from "react";
import { SelectRow } from "react-bootstrap-table";
import { ProblemId } from "../interfaces/Status";
import { PROBLEM_ID_SEPARATE_SYMBOL } from "./QueryString";

const reducer = (
  prevState: Set<ProblemId>,
  action: {
    type: "ADD" | "DELETE";
    ids: ProblemId[];
  }
) => {
  const newSet = new Set(prevState);
  switch (action.type) {
    case "ADD":
      for (const id of action.ids) {
        newSet.add(id);
      }
      break;
    case "DELETE":
      for (const id of action.ids) {
        newSet.delete(id);
      }
      break;
    default:
      throw "Not implemented action type.";
  }
  return newSet;
};

export const useProblemIdSelection = (): [
  (problemId: ProblemId) => boolean,
  () => ProblemId[],
  (problemIds: ProblemId[]) => void,
  (problemIds: ProblemId[]) => void
] => {
  const [selectedProblemIdSet, dispatch] = useReducer(
    reducer,
    new Set<ProblemId>()
  );

  const has = useCallback(
    (problemId: ProblemId) => selectedProblemIdSet.has(problemId),
    [selectedProblemIdSet]
  );

  const get = useCallback(() => Array.from(selectedProblemIdSet), [
    selectedProblemIdSet,
  ]);

  const select = useCallback(
    (problemIds: ProblemId[]) => dispatch({ type: "ADD", ids: problemIds }),
    []
  );
  const deselect = useCallback(
    (problemIds: ProblemId[]) => dispatch({ type: "DELETE", ids: problemIds }),
    []
  );

  return [has, get, select, deselect];
};

export const createContestLocationFromProblemIds = (
  problemIds: ProblemId[]
) => {
  const problemIdToString = problemIds.join(PROBLEM_ID_SEPARATE_SYMBOL);
  return {
    pathname: "/contest/create",
    search: !problemIdToString ? "" : "?problemIds=" + problemIdToString,
  };
};

export const selectRowPropsForProblemSelection = (
  problemIds: ProblemId[],
  get: () => ProblemId[],
  select: (problemIds: ProblemId[]) => void,
  deselect: (problemIds: ProblemId[]) => void
): SelectRow => {
  interface HasProblemId {
    id: ProblemId;
  }
  return {
    mode: "checkbox",
    selected: problemIds,
    onSelect: (row: HasProblemId, isSelected: boolean) => {
      if (isSelected) {
        select([row.id]);
      } else {
        deselect([row.id]);
      }
    },
    onSelectAll: (isSelected: boolean, rows: HasProblemId[]) => {
      const ids = rows.map(({ id }) => id);
      if (isSelected) {
        select(ids);
      } else {
        deselect(ids);
      }
      return get();
    },
  };
};

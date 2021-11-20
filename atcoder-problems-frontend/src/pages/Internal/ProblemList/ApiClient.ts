import {
  LIST_ITEM_ADD,
  LIST_ITEM_DELETE,
  LIST_ITEM_UPDATE,
  LIST_UPDATE,
} from "../ApiUrl";

export const updateProblemList = (name: string, listId: string) =>
  fetch(LIST_UPDATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ internal_list_id: listId, name }),
  });

export const addProblemItem = (problemId: string, listId: string) =>
  fetch(LIST_ITEM_ADD, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      internal_list_id: listId,
      problem_id: problemId,
    }),
  });

export const deleteProblemItem = (problemId: string, listId: string) =>
  fetch(LIST_ITEM_DELETE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      internal_list_id: listId,
      problem_id: problemId,
    }),
  });

export const updateProblemItem = (
  problemId: string,
  memo: string,
  listId: string
) =>
  fetch(LIST_ITEM_UPDATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      internal_list_id: listId,
      problem_id: problemId,
      memo,
    }),
  });

import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import { Map } from "immutable";
import {
  Alert,
  Button,
  ButtonGroup,
  Col,
  Input,
  ListGroup,
  ListGroupItem,
  ListGroupItemHeading,
  ListGroupItemText,
  Row,
  Spinner,
} from "reactstrap";
import { useHistory, useLocation } from "react-router-dom";
import {
  LIST_ITEM_ADD,
  LIST_ITEM_DELETE,
  LIST_ITEM_UPDATE,
  LIST_UPDATE,
  listGetUrl,
  USER_GET,
} from "../ApiUrl";
import * as CachedApi from "../../../utils/CachedApiClient";
import Problem from "../../../interfaces/Problem";
import { ProblemId } from "../../../interfaces/Status";
import { ProblemSearchBox } from "../../../components/ProblemSearchBox";
import { formatProblemUrl } from "../../../utils/Url";
import { ProblemList, ProblemListItem, UserResponse } from "../types";
import { NewTabLink } from "../../../components/NewTabLink";

interface OuterProps {
  listId: string;
}
interface InnerProps extends OuterProps {
  userInfoFetch: PromiseState<UserResponse | null>;
  problemListFetch: PromiseState<ProblemList>;
  updateList: (name: string) => void;
  updateListResponse: PromiseState<{} | null>;
  problems: PromiseState<Map<ProblemId, Problem>>;

  addItem: (problemId: string) => void;
  deleteItem: (problemId: string) => void;
  updateItem: (problemId: string, memo: string) => void;
}

export const SingleProblemList = connect<OuterProps, InnerProps>((props) => ({
  userInfoFetch: USER_GET,
  problemListFetch: listGetUrl(props.listId),
  updateList: (name: string) => ({
    updateListResponse: {
      url: LIST_UPDATE,
      method: "POST",
      body: JSON.stringify({ internal_list_id: props.listId, name }),
      force: true,
    },
  }),
  updateListResponse: { value: null },
  problems: {
    comparison: null,
    value: () => CachedApi.cachedProblemMap(),
  },
  addItem: (problemId: string) => ({
    problemListFetch: {
      url: LIST_ITEM_ADD,
      method: "POST",
      body: JSON.stringify({
        internal_list_id: props.listId,
        problem_id: problemId,
      }),
      then: (): string => listGetUrl(props.listId),
    },
  }),
  deleteItem: (problemId: string) => ({
    problemListFetch: {
      url: LIST_ITEM_DELETE,
      method: "POST",
      body: JSON.stringify({
        internal_list_id: props.listId,
        problem_id: problemId,
      }),
      then: (): string => listGetUrl(props.listId),
    },
  }),
  updateItem: (problemId: string, memo: string) => ({
    problemListFetch: {
      url: LIST_ITEM_UPDATE,
      method: "POST",
      body: JSON.stringify({
        internal_list_id: props.listId,
        problem_id: problemId,
        memo,
      }),
      then: (): string => listGetUrl(props.listId),
    },
  }),
}))((props) => {
  const { problemListFetch, userInfoFetch } = props;
  const internalUserId =
    userInfoFetch.fulfilled && userInfoFetch.value
      ? userInfoFetch.value.internal_user_id
      : null;
  if (problemListFetch.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (problemListFetch.rejected || !problemListFetch.value) {
    return <Alert color="danger">Failed to fetch list info.</Alert>;
  }
  const listInfo = problemListFetch.value;
  const modifiable = listInfo.internal_user_id === internalUserId;
  const [adding, setAdding] = useState(false);
  const problems = props.problems.fulfilled
    ? props.problems.value.valueSeq().toArray()
    : [];
  const location = useLocation();
  const history = useHistory();

  return (
    <>
      <Row className="my-2">
        <Col sm="12">
          <h2>
            <DoubleClickEdit
              modifiable={modifiable}
              saveText={(name): void => props.updateList(name)}
              initialText={listInfo.internal_list_name}
            />
          </h2>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          {adding ? (
            <ProblemSearchBox
              problems={problems}
              selectProblem={(problem): void => {
                props.addItem(problem.id);
              }}
            />
          ) : modifiable ? (
            <Button color="success" onClick={(): void => setAdding(!adding)}>
              Add
            </Button>
          ) : null}
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <Button
            onClick={(): void =>
              history.push({
                ...location,
                pathname: "/contest/create",
                search: `problems=${encodeURIComponent(
                  JSON.stringify(listInfo.items.map((data) => data.problem_id))
                )}`,
              })
            }
          >
            Create Virtual Contest
          </Button>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <ListGroup>
            {listInfo.items.map((item) => {
              const problem = problems.find((p) => p.id === item.problem_id);
              return (
                <ProblemEntry
                  modifiable={modifiable}
                  key={item.problem_id}
                  item={item}
                  problem={problem}
                  saveText={(memo: string): void =>
                    props.updateItem(item.problem_id, memo)
                  }
                  deleteItem={(): void => props.deleteItem(item.problem_id)}
                />
              );
            })}
          </ListGroup>
        </Col>
      </Row>
    </>
  );
});

const ProblemEntry: React.FC<{
  item: ProblemListItem;
  problem: Problem | undefined;
  saveText: (text: string) => void;
  deleteItem: () => void;
  modifiable: boolean;
}> = (props) => {
  const { item, problem } = props;
  const [isEdit, setEdit] = useState(false);
  const [text, setText] = useState(item.memo);
  return (
    <ListGroupItem
      onDoubleClick={(): void => {
        if (props.modifiable) {
          setEdit(true);
        }
      }}
    >
      {props.modifiable ? (
        <ButtonGroup style={{ float: "right" }}>
          {isEdit ? (
            <Button
              color="success"
              onClick={(): void => {
                setEdit(false);
                props.saveText(text);
              }}
            >
              Save
            </Button>
          ) : (
            <Button onClick={(): void => setEdit(true)}>Edit</Button>
          )}
          {isEdit ? null : (
            <Button color="danger" onClick={(): void => props.deleteItem()}>
              Remove
            </Button>
          )}
        </ButtonGroup>
      ) : null}
      <ListGroupItemHeading>
        {problem ? (
          <NewTabLink href={formatProblemUrl(problem.id, problem.contest_id)}>
            {problem.title}
          </NewTabLink>
        ) : (
          item.problem_id
        )}
      </ListGroupItemHeading>
      <ListGroupItemText>
        {isEdit ? (
          <Input
            type="textarea"
            value={text}
            onChange={(e): void => setText(e.target.value)}
            onKeyDown={(e): void => {
              if (e.ctrlKey && e.key === "Enter") {
                setEdit(false);
                props.saveText(text);
              }
            }}
          />
        ) : (
          <pre>{text}</pre>
        )}
      </ListGroupItemText>
    </ListGroupItem>
  );
};

const DoubleClickEdit: React.FC<{
  saveText: (text: string) => void;
  initialText: string;
  modifiable: boolean;
}> = (props) => {
  const [text, setText] = useState(props.initialText);
  const [isInput, setIsInput] = useState(false);

  return (
    <>
      {isInput ? (
        <>
          <Input
            type="text"
            value={text}
            onChange={(e): void => setText(e.target.value)}
            onBlur={(): void => {
              setIsInput(!isInput);
              props.saveText(text);
            }}
            onKeyDown={(e): void => {
              if (e.key === "Enter") {
                setIsInput(!isInput);
                props.saveText(text);
              }
            }}
          />
          <Button
            color="success"
            onClick={(): void => {
              setIsInput(!isInput);
              props.saveText(text);
            }}
          >
            Save
          </Button>
        </>
      ) : (
        <>
          <span
            onDoubleClick={(): void => {
              if (props.modifiable) {
                setIsInput(!isInput);
              }
            }}
          >
            {text.length > 0 ? text : "(empty)"}
          </span>{" "}
          <Button
            onClick={(): void => {
              if (props.modifiable) {
                setIsInput(!isInput);
              }
            }}
          >
            Edit Title
          </Button>
        </>
      )}
    </>
  );
};

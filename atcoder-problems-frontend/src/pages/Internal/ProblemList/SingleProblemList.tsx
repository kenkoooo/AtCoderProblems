import React, { useState } from "react";
import { List } from "immutable";
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
import { useProblems } from "../../../api/APIClient";
import { useLoginState, useProblemList } from "../../../api/InternalAPIClient";
import Problem from "../../../interfaces/Problem";
import { ProblemSearchBox } from "../../../components/ProblemSearchBox";
import { formatProblemUrl } from "../../../utils/Url";
import { ProblemListItem } from "../types";
import { NewTabLink } from "../../../components/NewTabLink";
import { ContestCreatePage } from "../VirtualContest/ContestCreatePage";
import {
  updateProblemList,
  addProblemItem,
  deleteProblemItem,
  updateProblemItem,
} from "./ApiClient";
interface Props {
  listId: string;
}

export const SingleProblemList = (props: Props) => {
  const { listId } = props;
  const loginState = useLoginState();
  const [adding, setAdding] = useState(false);
  const [creatingContest, setCreatingContest] = useState(false);
  const problems = useProblems() ?? [];

  const problemListFetch = useProblemList(listId);

  const internalUserId = loginState.data?.internal_user_id;

  if (!problemListFetch.data && !problemListFetch.error) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (!problemListFetch.data) {
    return <Alert color="danger">Failed to fetch list info.</Alert>;
  }
  const listInfo = problemListFetch.data;
  const modifiable = listInfo?.internal_user_id === internalUserId;

  return creatingContest ? (
    <>
      <Row className="mt-2 mb-4">
        <Button
          color="danger"
          outline
          onClick={(): void => setCreatingContest(false)}
        >
          Cancel
        </Button>
      </Row>
      <ContestCreatePage
        initialProblems={List(
          listInfo.items.map((info) => ({
            id: info.problem_id,
            order: null,
            point: null,
          }))
        )}
      />
    </>
  ) : (
    <>
      <Row className="my-2">
        <Col sm="12">
          <h2>
            <DoubleClickEdit
              modifiable={modifiable}
              saveText={async (name) => {
                await updateProblemList(name, listId);
              }}
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
              selectProblem={async (problem) =>
                await addProblemItem(problem.id, listId).then(() =>
                  problemListFetch.mutate()
                )
              }
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
            color="success"
            onClick={(): void => setCreatingContest(true)}
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
                  saveText={async (memo: string) => {
                    await updateProblemItem(item.problem_id, memo, listId);
                    await problemListFetch.mutate();
                  }}
                  deleteItem={async () => {
                    await deleteProblemItem(item.problem_id, listId);
                    await problemListFetch.mutate();
                  }}
                />
              );
            })}
          </ListGroup>
        </Col>
      </Row>
    </>
  );
};

const ProblemEntry: React.FC<{
  item: ProblemListItem;
  problem: Problem | undefined;
  saveText: (text: string) => Promise<void>;
  deleteItem: () => Promise<void>;
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
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={async () => {
                setEdit(false);
                await props.saveText(text);
              }}
            >
              Save
            </Button>
          ) : (
            <Button onClick={(): void => setEdit(true)}>Edit</Button>
          )}
          {isEdit ? null : (
            <Button
              color="danger"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={async () => await props.deleteItem()}
            >
              Remove
            </Button>
          )}
        </ButtonGroup>
      ) : null}
      <ListGroupItemHeading>
        {problem ? (
          <NewTabLink href={formatProblemUrl(problem.id, problem.contest_id)}>
            {problem.problem_index}. {problem.name}
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
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onKeyDown={async (e) => {
              if (e.ctrlKey && e.key === "Enter") {
                setEdit(false);
                await props.saveText(text);
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
  saveText: (text: string) => Promise<void>;
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
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onBlur={async () => {
              setIsInput(!isInput);
              await props.saveText(text);
            }}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                setIsInput(!isInput);
                await props.saveText(text);
              }
            }}
          />
          <Button
            color="success"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={async () => {
              setIsInput(!isInput);
              await props.saveText(text);
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

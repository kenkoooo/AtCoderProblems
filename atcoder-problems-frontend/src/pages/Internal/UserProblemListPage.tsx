import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  ListGroup,
  ListGroupItem,
  ListGroupItemHeading,
  ListGroupItemText,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";
import { Link, useHistory } from "react-router-dom";
import { useMyList } from "../../api/InternalAPIClient";
import { LIST_CREATE, LIST_DELETE } from "./ApiUrl";

interface CreateListResponse {
  internal_list_id: string;
}

const createNewList = () =>
  fetch(LIST_CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ list_name: "New List" }),
  })
    .then((response) => response.json())
    .then((response) => response as CreateListResponse);

const deleteList = (internalListId: string) =>
  fetch(LIST_DELETE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ internal_list_id: internalListId }),
  });

export const UserProblemListPage: React.FC = () => {
  const history = useHistory();
  const myListFetch = useMyList();

  if (myListFetch.error) {
    return <Alert color="danger">Failed to fetch list info.</Alert>;
  }
  if (!myListFetch.data) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }

  const myList = myListFetch.data ?? [];

  return (
    <>
      <Row className="my-2">
        <Col sm="12">
          <Button
            color="success"
            onClick={async () => {
              const internalListId = (await createNewList()).internal_list_id;
              history.push({ pathname: `/problemlist/${internalListId}` });
            }}
          >
            Create New List
          </Button>
        </Col>
      </Row>

      <Row className="my-2">
        <Col sm="12">
          <ListGroup>
            {myList.map(({ internal_list_id, internal_list_name, items }) => (
              <SingleListEntry
                key={internal_list_id}
                internalListId={internal_list_id}
                internalListName={internal_list_name}
                listItemCount={items.length}
                deleteList={async (internalListId) => {
                  await deleteList(internalListId);
                  await myListFetch.mutate();
                }}
              />
            ))}
          </ListGroup>
        </Col>
      </Row>
    </>
  );
};

interface SingleListEntryProps {
  internalListId: string;
  internalListName: string;
  listItemCount: number;
  deleteList: (internalListId: string) => void;
}

const SingleListEntry: React.FC<SingleListEntryProps> = (props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const toggle = (): void => setModalOpen(!modalOpen);
  return (
    <ListGroupItem>
      <Button
        style={{ float: "right" }}
        color="danger"
        onClick={(): void => setModalOpen(true)}
      >
        Remove
      </Button>
      <Modal isOpen={modalOpen} toggle={toggle}>
        <ModalHeader toggle={toggle}>
          Remove {props.internalListName}?
        </ModalHeader>
        <ModalBody>
          Do you really want to remove {props.internalListName}?
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            onClick={(): void => {
              toggle();
              props.deleteList(props.internalListId);
            }}
          >
            Remove
          </Button>{" "}
          <Button color="secondary" onClick={toggle}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      <ListGroupItemHeading>
        <Link to={`/problemlist/${props.internalListId}`}>
          {props.internalListName.length > 0
            ? props.internalListName
            : "(no name)"}
        </Link>
      </ListGroupItemHeading>
      <ListGroupItemText>
        <Badge pill>{props.listItemCount}</Badge>
      </ListGroupItemText>
    </ListGroupItem>
  );
};

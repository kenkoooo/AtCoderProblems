import { connect, PromiseState } from "react-refetch";
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
  Spinner
} from "reactstrap";
import { LIST_CREATE, LIST_DELETE, LIST_MY, USER_GET } from "./ApiUrl";
import { Link, Redirect } from "react-router-dom";
import UserInfo from "../../interfaces/UserInfo";
import { ProblemList } from "./types";

interface Props {
  userInfoFetch: PromiseState<UserInfo | null>;
  myListFetch: PromiseState<ProblemList[] | null>;
  createListFetch: PromiseState<{ internal_list_id: string } | null>;
  createNewList: () => void;
  deleteList: (internalListId: string) => void;
  deleteResponse: PromiseState<{} | null>;
}

export default connect<{}, Props>(() => ({
  userInfoFetch: USER_GET,
  myListFetch: LIST_MY,
  createListFetch: { value: null },
  createNewList: () => ({
    createListFetch: {
      url: LIST_CREATE,
      method: "POST",
      body: JSON.stringify({ list_name: "New List" })
    }
  }),
  deleteList: (internalListId: string) => ({
    deleteResponse: {
      url: LIST_DELETE,
      method: "POST",
      body: JSON.stringify({ internal_list_id: internalListId }),
      andThen: () => ({
        myListFetch: {
          url: LIST_MY,
          refreshing: true,
          force: true
        }
      })
    }
  }),
  deleteResponse: { value: null }
}))(props => {
  const { createListFetch, myListFetch } = props;
  if (createListFetch.fulfilled && createListFetch.value !== null) {
    const listId = createListFetch.value.internal_list_id;
    return <Redirect to={`/problemlist/${listId}`} />;
  }
  if (myListFetch.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (myListFetch.rejected || !myListFetch.value) {
    return <Alert color="danger">Failed to fetch list info.</Alert>;
  }

  const myList = myListFetch.value;

  return (
    <>
      <Row className="my-2">
        <Col sm="12">
          <Button color="success" onClick={() => props.createNewList()}>
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
                deleteList={props.deleteList}
              />
            ))}
          </ListGroup>
        </Col>
      </Row>
    </>
  );
});

const SingleListEntry = (props: {
  internalListId: string;
  internalListName: string;
  listItemCount: number;
  deleteList: (internalListId: string) => void;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const toggle = () => setModalOpen(!modalOpen);
  return (
    <ListGroupItem>
      <Button
        style={{ float: "right" }}
        color="danger"
        onClick={() => setModalOpen(true)}
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
            onClick={() => {
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

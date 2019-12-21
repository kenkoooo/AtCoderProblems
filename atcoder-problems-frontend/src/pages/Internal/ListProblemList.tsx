import { connect, PromiseState } from "react-refetch";
import React from "react";
import { Alert, Button, Col, Row, Spinner, Table } from "reactstrap";
import { LIST_CREATE, LIST_MY, USER_GET } from "./ApiUrl";
import { Link, Redirect } from "react-router-dom";
import UserInfo from "../../interfaces/UserInfo";
import { ProblemList } from "./ProblemList/types";

interface Props {
  userInfoFetch: PromiseState<UserInfo | null>;
  myListFetch: PromiseState<ProblemList[] | null>;
  createListFetch: PromiseState<{ internal_list_id: string } | null>;
  createNewList: () => void;
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
  })
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
          <Table>
            <thead>
              <tr>
                <th>List</th>
              </tr>
            </thead>
            <tbody>
              {myList.map(({ internal_list_id, internal_list_name }) => (
                <tr key={internal_list_id}>
                  <td>
                    <Link to={`/problemlist/${internal_list_id}`}>
                      {internal_list_name.length > 0
                        ? internal_list_name
                        : "(empty)"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
});

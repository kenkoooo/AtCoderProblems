import React from "react";
import { Alert, Button, Col, Input, Label, Row } from "reactstrap";

interface Props {
  userId: string;
  setUserId: (userId: string) => void;
  status: "updating" | "updated" | "open";
  onSubmit: () => void;
}

export const UserIdUpdate = (props: Props) => {
  return (
    <form
      onSubmit={(event): void => {
        event.preventDefault();
        props.onSubmit();
      }}
    >
      <Row className="my-2">
        <Col sm="12">
          <h2>Account Info</h2>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <Label>AtCoder User ID</Label>
          <Input
            type="text"
            placeholder="AtCoder User ID"
            value={props.userId}
            pattern="[a-zA-Z0-9_]*"
            onChange={(event): void => props.setUserId(event.target.value)}
          />
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <Button
            disabled={props.status === "updating"}
            as="button"
            type="submit"
          >
            {props.status === "updating" ? "Updating..." : "Update"}
          </Button>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <Alert color="success" isOpen={props.status === "updated"}>
            Updated
          </Alert>
        </Col>
      </Row>
    </form>
  );
};

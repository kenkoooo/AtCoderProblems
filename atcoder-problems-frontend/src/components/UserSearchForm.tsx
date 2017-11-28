import * as React from "react";
import { Arguments } from "../utils/Arguments";
import {
  FormGroup,
  ControlLabel,
  FormControl,
  Radio,
  Button,
  Form,
  ToggleButton,
  ToggleButtonGroup
} from "react-bootstrap";

export interface UserSearchFormProps {
  userId: string;
}

export class UserSearchForm extends React.Component<UserSearchFormProps, {}> {
  render() {
    return (
      <Form action="./" method="get" inline>
        <FormGroup>
          <ControlLabel>User ID: </ControlLabel>
          <FormControl
            placeholder="UserID"
            type="text"
            name="user"
            defaultValue={this.props.userId}
          />
          <FormControl name="kind" value="user" type="hidden" />
        </FormGroup>{" "}
        <Button type="submit">Search</Button>
      </Form>
    );
  }
}

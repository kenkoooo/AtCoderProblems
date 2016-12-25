import React from 'react';
import {FormGroup, FormControl, Button, ControlLabel} from 'react-bootstrap';

class UserSearchBox {
  render() {
    return (
      <form action="./" method="get">
        <FormGroup>
          <ControlLabel>User ID:</ControlLabel>
          <FormControl type="text" placeholder="User ID" name="name"/>
          <FormControl type="hidden" name="kind" value="user"/>
        </FormGroup>
        <Button type="submit">Search</Button>
      </form>
    );
  }
}

export default UserSearchBox;

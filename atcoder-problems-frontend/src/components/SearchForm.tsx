import * as React from "react";
import { Arguments } from "../utils/Arguments";
import { FormGroup, ControlLabel, FormControl, Radio, Button, Form, ToggleButton, ToggleButtonGroup } from "react-bootstrap";

export interface SearchFormProps {
    args: Arguments;
}

export class SearchForm extends React.Component<SearchFormProps, {}>{
    render() {
        let userId = this.props.args.userId;
        let rivals = this.props.args.rivals.join(",");
        let kind = this.props.args.kind;
        return (
            <Form action="./" method="get" inline>
                <FormGroup>
                    <ControlLabel>User ID: </ControlLabel>
                    <FormControl placeholder="UserID" type="text" name="user" defaultValue={userId} />
                </FormGroup>
                {' '}
                <FormGroup>
                    <ControlLabel>Rivals: </ControlLabel>
                    <FormControl placeholder="UserID,UserID,..." type="text" name="rivals" defaultValue={rivals} />
                </FormGroup>
                {' '}
                <ToggleButtonGroup type="radio" name="kind" defaultValue={kind}>
                    <ToggleButton value="category">Category</ToggleButton>
                    <ToggleButton value="list">List</ToggleButton>
                </ToggleButtonGroup>
                {' '}
                <Button type="submit">Search</Button>
            </Form>
        );
    }
}

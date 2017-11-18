import * as React from "react";
import { FormGroup, ControlLabel, FormControl, Radio, Button, Form, ToggleButton, ToggleButtonGroup } from "react-bootstrap";

export interface SearchFormProps {
    userId: string,
    rivals: string,
    kind: string
}

export class SearchForm extends React.Component<SearchFormProps, {}>{
    render() {
        return (
            <Form action="./index.html" method="get" inline>
                <FormGroup>
                    <ControlLabel>User ID: </ControlLabel>
                    <FormControl placeholder="UserID" type="text" name="name" defaultValue={this.props.userId} />
                </FormGroup>
                {' '}
                <FormGroup>
                    <ControlLabel>Rivals: </ControlLabel>
                    <FormControl placeholder="UserID,UserID,..." type="text" name="rivals" defaultValue={this.props.rivals} />
                </FormGroup>
                {' '}
                <ToggleButtonGroup type="radio" name="kind" defaultValue={this.props.kind}>
                    <ToggleButton value="index">Category</ToggleButton>
                    <ToggleButton value="list">List</ToggleButton>
                </ToggleButtonGroup>
                {' '}
                <Button type="submit">Search</Button>
            </Form>
        );
    }
}

import * as React from "react";
import * as QueryString from "query-string";

export interface HelloProps { compiler: string; framework: string; }

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class Hello extends React.Component<HelloProps, {}> {
    render() {
        let parsed = QueryString.parse(location.search);
        console.log(parsed);
        return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>;
    }
}


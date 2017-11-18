import * as React from "react";
import * as QueryString from "query-string";
import { NavigationBar } from "./NavigationBar";
import { SearchForm } from "./SearchForm";
import { Grid } from "react-bootstrap";

/**
 * Main view
 */
export class Application extends React.Component<{}, {}> {
    render() {
        // parse GET parameters
        let params = QueryString.parse(location.search);
        console.log(params);
        return (
            <Grid>
                <SearchForm userId={params.name} rivals={params.rivals} kind={params.kind} />
            </Grid>
        );
    }
}

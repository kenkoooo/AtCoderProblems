import * as React from "react";
import * as QueryString from "query-string";
import { SearchForm } from "./SearchForm";
import { Category } from "./Category";
import { Grid } from "react-bootstrap";

/**
 * Main view
 */
export class Application extends React.Component<{}, {}> {
    render() {
        // parse GET parameters
        let params = QueryString.parse(location.search);
        let userId = ("user" in params) ? params["user"] : "";
        let rivals = ("rivals" in params) ? params["rivals"] : "";
        let kind = ("kind" in params) ? params["kind"] : "category";

        return (
            <Grid>
                <SearchForm userId={userId} rivals={rivals} kind={kind} />
                <Category />
            </Grid>
        );
    }
}

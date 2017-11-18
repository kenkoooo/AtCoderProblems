import * as React from "react";
import * as ReactDOM from "react-dom";

import { Application } from "./components/Application";
import { NavigationBar } from "./components/NavigationBar";

ReactDOM.render(
    <div>
        <NavigationBar />
        <Application />
    </div>
    , document.getElementById("root")
);

import { HtmlFormatter } from "./HtmlFormatter";
import * as React from "react";

test("create link element", () => {
    let link = HtmlFormatter.createLink("http://example.com", "link");
    expect(link).toEqual(<a href="http://example.com" target="_blank">link</a>);
});
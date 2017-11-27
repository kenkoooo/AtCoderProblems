import { HtmlFormatter } from "./HtmlFormatter";
import * as React from "react";
import { option } from "ts-option";

test("create link element", () => {
  let link = HtmlFormatter.createLink("http://example.com", "link");
  expect(link).toEqual(
    <a href="http://example.com" target="_blank">
      link
    </a>
  );
});

test("get cell color", () => {
  let acceptedProblemId = "accepted";
  let wrongProblemId = "wrong";
  let rivalProblemId = "rival";
  let bothSolved = "both";
  let wrongAndRival = "wrong-rival";

  let accepted = new Set([acceptedProblemId, bothSolved]);
  let rival = new Set([rivalProblemId, bothSolved, wrongAndRival]);
  let wrong = new Map([[wrongProblemId, "WA"], [wrongAndRival, "RE"]]);
  expect(
    HtmlFormatter.getCellColor(
      option({ contestId: "", id: acceptedProblemId, title: "" }),
      accepted,
      rival,
      wrong
    )
  ).toEqual("success");
  expect(
    HtmlFormatter.getCellColor(
      option({ contestId: "", id: rivalProblemId, title: "" }),
      accepted,
      rival,
      wrong
    )
  ).toEqual("danger");
  expect(
    HtmlFormatter.getCellColor(
      option({ contestId: "", id: wrongProblemId, title: "" }),
      accepted,
      rival,
      wrong
    )
  ).toEqual("warning");
  expect(
    HtmlFormatter.getCellColor(
      option({ contestId: "", id: bothSolved, title: "" }),
      accepted,
      rival,
      wrong
    )
  ).toEqual("success");
  expect(
    HtmlFormatter.getCellColor(
      option({ contestId: "", id: wrongAndRival, title: "" }),
      accepted,
      rival,
      wrong
    )
  ).toEqual("danger");
});

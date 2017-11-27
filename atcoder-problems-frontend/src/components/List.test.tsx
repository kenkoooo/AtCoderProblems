import * as fs from "fs";
import * as React from "react";
import { List } from "./List";
import { shallow, mount } from "enzyme";
import { configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import toJson from "enzyme-to-json";
import { SubmissionUtlis } from "../utils/SubmissionUtils";

configure({ adapter: new Adapter() });
let DB = JSON.parse(fs.readFileSync("./db.json").toString());
test("render list view", () => {
  let userId = "kenkoooo";
  let rivals = ["chokudai", "iwiwi"];

  let problems = DB["problems"];
  let contests = DB["contests"];
  let submissions = DB["results"];
  let acceptedProblems = new Set(
    SubmissionUtlis.extractProblemIdsByUsers(
      submissions,
      new Set([userId])
    ).keys()
  );
  let wrongProblemMap = SubmissionUtlis.extractProblemIdsByUsers(
    submissions,
    new Set([userId]),
    new Set(["WA", "TLE", "MLE", "RE"])
  );
  let rivalSet = new Set(rivals);
  let rivalMap = new Map<string, Set<string>>();
  submissions
    .filter(s => rivalSet.has(s.user_id) && s.result == "AC")
    .forEach(s => {
      if (!rivalMap.has(s.problem_id)) {
        rivalMap.set(s.problem_id, new Set<string>());
      }
      rivalMap.get(s.problem_id).add(s.user_id);
    });

  let wrapper = mount(
    <List
      problems={problems}
      contests={contests}
      acceptedProblems={acceptedProblems}
      wrongMap={wrongProblemMap}
      rivalMap={rivalMap}
    />
  );
  expect(toJson(wrapper)).toMatchSnapshot();
});

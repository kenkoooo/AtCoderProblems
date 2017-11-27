import * as React from "react";
import { Category } from "./Category";
import { shallow, mount } from "enzyme";
import { configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import toJson from "enzyme-to-json";
import * as fs from "fs";
import { SubmissionUtlis } from "../utils/SubmissionUtils";

configure({ adapter: new Adapter() });
let DB = JSON.parse(fs.readFileSync("./db.json").toString());
test("split problems", () => {
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
  let rivalProblems = new Set(
    SubmissionUtlis.extractProblemIdsByUsers(
      submissions,
      new Set(rivals)
    ).keys()
  );

  let wrapper = mount(
    <Category
      problems={problems}
      contests={contests}
      userId={"kenkoooo"}
      rivals={["chokudai", "iwiwi"]}
      acceptedProblems={acceptedProblems}
      wrongMap={wrongProblemMap}
      rivalProblems={rivalProblems}
    />
  );
  expect(toJson(wrapper)).toMatchSnapshot();
});

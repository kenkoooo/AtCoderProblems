import * as fs from "fs";
import * as React from "react";
import { SearchForm } from "./SearchForm";
import { shallow, mount } from "enzyme";
import { configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import toJson from "enzyme-to-json";
import { SubmissionUtils } from "../utils/SubmissionUtils";

configure({ adapter: new Adapter() });
test("render list view", () => {
  let wrapper = mount(
    <SearchForm
      args={{
        userId: "kenkoooo",
        rivals: ["chokudai", "iwiwi"],
        kind: "kind",
        ranking: ""
      }}
    />
  );
  expect(toJson(wrapper)).toMatchSnapshot();
});

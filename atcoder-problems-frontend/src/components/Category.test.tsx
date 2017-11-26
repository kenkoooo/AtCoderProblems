import * as React from "react";
import { Category } from "./Category";
import { shallow } from "enzyme";
import { configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import toJson from "enzyme-to-json";

configure({ adapter: new Adapter() });
test("split problems", () => {
  let problems = [
    { contestId: "arc999", id: "problem1", title: "" },
    { contestId: "agc999", id: "problem2", title: "" },
    { contestId: "abc999", id: "problem3", title: "" },
    { contestId: "other", id: "problem4", title: "" }
  ];
  let contests = [
    {
      id: "arc999",
      title: "AtCoder Regular Contest 999",
      start_epoch_second: 0
    },
    {
      id: "abc999",
      title: "AtCoder Beginner Contest 999",
      start_epoch_second: 0
    },
    {
      id: "agc999",
      title: "AtCoder Grand Contest 999",
      start_epoch_second: 0
    },
    {
      id: "other",
      title: "AtCoder Other Contest",
      start_epoch_second: 0
    }
  ];
  let wrapper = shallow(
    <Category problems={problems} contests={contests} userId={""} rivals={[]} />
  );
  expect(toJson(wrapper)).toMatchSnapshot();
});

import * as React from "react";
import { shallow, mount } from "enzyme";
import { configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import toJson from "enzyme-to-json";

import { NavigationBar } from "./NavigationBar";

configure({ adapter: new Adapter() });

test("render navigation bar", () => {
  let wrapper = mount(
    <NavigationBar
      args={{
        userId: "kenkoooo",
        rivals: ["chokudai", "iwiwi"],
        kind: "category",
        ranking: ""
      }}
    />
  );
  expect(toJson(wrapper)).toMatchSnapshot();
});

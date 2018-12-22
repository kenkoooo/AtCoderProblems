import * as React from "react";
import { configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import toJson from "enzyme-to-json";
import { mount } from "enzyme";
import { UserPageLanguages } from "./UserPageLanguages";

configure({ adapter: new Adapter() });
let DB = require("../../db")();

test("language counts on user page", () => {
  let wrapper = mount(<UserPageLanguages submissions={DB["results"]} />);
  expect(toJson(wrapper)).toMatchSnapshot();
});

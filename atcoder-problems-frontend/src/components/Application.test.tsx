import * as React from "react";
import { configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import toJson from "enzyme-to-json";
import { shallow, mount } from "enzyme";
import { MockRequest } from "../utils/TestUtils";

configure({ adapter: new Adapter() });
let DB = require("../../db")();

function mockApiCall() {
  jest.mock("superagent");
  let mockAgent = require("superagent");
  mockAgent.get.mockImplementation((url: string, query?) => {
    if (url === "./atcoder-api/results") {
      return new MockRequest(DB["results"]);
    } else {
      let index = url.replace("./atcoder-api/info/", "");
      return new MockRequest(DB[index]);
    }
  });
}

test("category view", () => {
  mockApiCall();
  jest.mock("../utils/Arguments");
  let mockArgumentParser = require("../utils/Arguments").ArgumentParser;
  mockArgumentParser.parse.mockReturnValueOnce({
    userId: "kenkoooo",
    rivals: ["chokudai", "iwiwi"],
    kind: "category",
    ranking: ""
  });

  let Application = require("./Application").Application;
  let wrapper = mount(<Application />);
  expect(toJson(wrapper)).toMatchSnapshot();
});

test("list view", () => {
  mockApiCall();
  jest.mock("../utils/Arguments");
  let mockArgumentParser = require("../utils/Arguments").ArgumentParser;
  mockArgumentParser.parse.mockReturnValueOnce({
    userId: "kenkoooo",
    rivals: ["chokudai", "iwiwi"],
    kind: "list",
    ranking: ""
  });

  let Application = require("./Application").Application;
  let wrapper = mount(<Application />);
  expect(toJson(wrapper)).toMatchSnapshot();
});

test("ranking view", () => {
  mockApiCall();
  jest.mock("../utils/Arguments");
  let mockArgumentParser = require("../utils/Arguments").ArgumentParser;
  mockArgumentParser.parse.mockReturnValueOnce({
    userId: "",
    rivals: [],
    kind: "ranking",
    ranking: "ac"
  });

  let Application = require("./Application").Application;
  let wrapper = mount(<Application />);
  expect(toJson(wrapper)).toMatchSnapshot();
});

test("list view", () => {
  mockApiCall();
  jest.mock("../utils/Arguments");
  let mockArgumentParser = require("../utils/Arguments").ArgumentParser;
  mockArgumentParser.parse.mockReturnValueOnce({
    userId: "kenkoooo",
    rivals: ["chokudai", "iwiwi"],
    kind: "list",
    ranking: ""
  });

  let Application = require("./Application").Application;
  let wrapper = mount(<Application />);
  expect(toJson(wrapper)).toMatchSnapshot();
});

test("user page view", () => {
  mockApiCall();
  jest.mock("../utils/Arguments");
  let mockArgumentParser = require("../utils/Arguments").ArgumentParser;
  mockArgumentParser.parse.mockReturnValueOnce({
    userId: "kenkoooo",
    rivals: [],
    kind: "user",
    ranking: ""
  });

  let Application = require("./Application").Application;
  let wrapper = mount(<Application />);
  expect(toJson(wrapper)).toMatchSnapshot();
});

test("parse GET parameters", () => {
  jest.mock("query-string");
  let mockParser = require("query-string");
  mockParser.parse.mockReturnValueOnce({
    user: "user0",
    rivals: "user1,user2",
    kind: "kind-param"
  });

  let ArgumentParser = require("./Arguments").ArgumentParser;
  let args = ArgumentParser.parse();
  expect(args.userId).toEqual("user0");
  expect(args.rivals).toEqual(["user1", "user2"]);
  expect(args.kind).toEqual("kind-param");
});

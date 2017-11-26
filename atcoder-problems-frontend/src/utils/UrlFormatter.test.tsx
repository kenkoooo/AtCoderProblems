import { UrlFormatter } from "./UrlFormatter";

test("format contest url", () => {
    let url = UrlFormatter.contestUrl({ id: "contest-name", title: "", start_epoch_second: 0 });
    expect(url).toEqual("https://beta.atcoder.jp/contests/contest-name/");
});

test("format problem url", () => {
    let url = UrlFormatter.problemUrl({ id: "contest-name", title: "", start_epoch_second: 0 }, {
        contestId: "", id: "problem-id", title: ""
    });
    expect(url).toEqual("https://beta.atcoder.jp/contests/contest-name/tasks/problem-id");
});


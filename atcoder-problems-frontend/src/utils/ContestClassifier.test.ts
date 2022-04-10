import Contest from "../interfaces/Contest";
import {
  isRatedContest,
  classifyContest,
  ContestCategory,
} from "./ContestClassifier";

describe("test function isRatedContest", () => {
  it("when is unrated", () => {
    const unratedContest: Contest = {
      duration_second: 7200,
      id: "abc001",
      rate_change: "-",
      start_epoch_second: 1381579200,
      title: "AtCoder Beginner Contest 001",
    };
    expect(isRatedContest(unratedContest, 4)).toBe(false);
  });

  it("when is rated", () => {
    const ratedContest: Contest = {
      duration_second: 6000,
      id: "abc042",
      rate_change: " ~ 1199",
      start_epoch_second: 1469275200,
      title: "AtCoder Beginner Contest 042",
    };
    expect(isRatedContest(ratedContest, 4)).toBe(true);
  });

  it("when is heuristic", () => {
    const heuristicContest: Contest = {
      duration_second: 6000,
      id: "ahc999",
      rate_change: "All",
      start_epoch_second: 1469275200,
      title: "AtCoder Heuristic Contest 999",
    };
    expect(isRatedContest(heuristicContest, 1)).toBe(false);
  });
});

describe("test function classifyContest", () => {
  it("when ABC", () => {
    const abcContest: Contest = {
      duration_second: 6000,
      id: "abc042",
      rate_change: " ~ 1199",
      start_epoch_second: 1469275200,
      title: "AtCoder Beginner Contest 042",
    };
    expect(classifyContest(abcContest)).toBe("ABC" as ContestCategory);
  });

  it("when ABC-like", () => {
    const abcLikeContest: Contest = {
      duration_second: 6000,
      id: "zone2021",
      rate_change: " ~ 1999",
      start_epoch_second: 1619870400,
      title: "ZONeエナジー プログラミングコンテスト  “HELLO SPACE”",
    };
    expect(classifyContest(abcLikeContest)).toBe("ABC-Like" as ContestCategory);
  });

  it("when Other Sponsored", () => {
    const otherSponsoredContest: Contest = {
      duration_second: 10800,
      id: "jsc2019-final",
      rate_change: "-",
      start_epoch_second: 1569728700,
      title: "第一回日本最強プログラマー学生選手権決勝",
    };
    expect(classifyContest(otherSponsoredContest)).toBe(
      "Other Sponsored" as ContestCategory
    );
  });

  it("when Other Contests", () => {
    const otherContest: Contest = {
      duration_second: 18000,
      id: "ttpc2019",
      rate_change: "-",
      start_epoch_second: 1567224300,
      title: "東京工業大学プログラミングコンテスト2019",
    };
    expect(classifyContest(otherContest)).toBe(
      "Other Contests" as ContestCategory
    );
  });
});

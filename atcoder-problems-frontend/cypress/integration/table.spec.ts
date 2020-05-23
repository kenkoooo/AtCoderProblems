describe("Table page", () => {
  // Remove & polyfill fetch with XmlHttpRequest to interrupt Ajax requests.
  // https://github.com/cypress-io/cypress-example-recipes/tree/master/examples/stubbing-spying__window-fetch#readme
  let polyfill: string;

  before(() => {
    const polyfillUrl = "https://unpkg.com/unfetch/dist/unfetch.umd.js";

    cy.request(polyfillUrl).then((response) => {
      polyfill = response.body;
    });
  });

  beforeEach(() => {
    cy.visit("", {
      onBeforeLoad(win) {
        delete win.fetch;
        win.eval(polyfill);
        win.fetch = win.unfetch;
      },
    });
  });

  it("Without user", () => {
    cy.contains("AtCoder Beginner Contest");

    cy.contains("ABC167");
    cy.contains("A. Registration")
      .should("have.attr", "href")
      .and("eq", "https://atcoder.jp/contests/abc167/tasks/abc167_a");
    cy.get("#DifficultyCircle-abc167_a-abc167.difficulty-circle").trigger(
      "mouseover"
    );
    cy.get(".tooltip.show").should("contain", "Difficulty:");

    Promise.all(
      [
        "ABC",
        "ARC",
        "AGC",
        "Other Rated Contests",
        "PAST",
        "JOI",
        "Marathon",
        "Other Contests",
      ].map((contestType) => cy.contains(contestType))
    );

    // Switch to ARC table
    cy.contains("ARC").click();
    cy.contains("AtCoder Regular Contest");
    cy.contains("ARC001");
  });

  it("When user type username, then problems are colored", () => {
    cy.server();
    cy.route(
      "GET",
      "**/atcoder-api/results?user=user",
      "fixture:results/user.json"
    ).as("fetchUserResults");
    cy.route(
      "GET",
      "**/atcoder-api/results?user=rival",
      "fixture:results/rival.json"
    ).as("fetchRivalResults");

    // Enter username and see tables are highlighted.
    const username = "user";
    cy.get("#user_id")
      .type(`${username}{enter}`)
      .url()
      .should("include", `#/table/${username}`);
    cy.wait("@fetchUserResults");
    cy.get(".table-success");

    // Enter rival and see diff
    const rival = "rival";
    cy.get("#rival_id")
      .type(`${rival}{enter}`)
      .url()
      .should("include", `#/table/${username}/${rival}`);
    cy.wait("@fetchRivalResults");
    cy.get(".table-danger");
  });
});

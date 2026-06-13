import { deleteDb } from "./common";

describe("Table page", () => {
  // Remove & polyfill fetch with XmlHttpRequest to interrupt Ajax requests.
  // https://github.com/cypress-io/cypress-example-recipes/tree/master/examples/stubbing-spying__window-fetch#readme
  let polyfill: string;

  before(() => {
    const polyfillUrl = "https://unpkg.com/unfetch/dist/unfetch.umd.js";

    cy.request(polyfillUrl).then((response) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      polyfill = response.body;
    });
  });

  beforeEach(() => {
    cy.visit("", {
      onBeforeLoad(window) {
        delete window.fetch;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        window.eval(polyfill);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        window.fetch = window.unfetch;
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

    cy.contains("ABC");
    cy.contains("ARC");
    cy.contains("AGC");
    cy.contains("ABC-Like");
    cy.contains("ARC-Like");
    cy.contains("AGC-Like");
    cy.contains("PAST");
    cy.contains("JOI");
    cy.contains("Marathon");
    cy.contains("Other Sponsored");
    cy.contains("Other Contests");

    // Switch to ARC table
    cy.contains("ARC").click();
    cy.contains("AtCoder Regular Contest");
    cy.contains("ARC001");
  });

  it("When user type username, then problems are colored", async () => {
    await deleteDb("user-submissions");
    await deleteDb("rival-submissions");

    cy.server();
    cy.route(
      "GET",
      "**/atcoder-api/v3/user/submissions?user=user&from_second=0",
      "fixture:results/user.json"
    ).as("fetchUserResults");
    cy.route(
      "GET",
      "**/atcoder-api/v3/user/submissions?user=user&from_second=1550253179",
      "fixture:results/empty.json"
    ).as("fetchUserResults");
    cy.route(
      "GET",
      "**/atcoder-api/v3/user/submissions?user=rival&from_second=0",
      "fixture:results/rival.json"
    ).as("fetchRivalResults");
    cy.route(
      "GET",
      "**/atcoder-api/v3/user/submissions?user=rival&from_second=1522333698",
      "fixture:results/empty.json"
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
    cy.contains("ARC").click(); // Fire click events to force updating window
    cy.contains("ABC").click();
    cy.get(".table-danger");
  });
});

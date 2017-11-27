import * as fs from "fs";
test("", () => {
  let db = JSON.parse(fs.readFileSync("./db.json").toString());
});

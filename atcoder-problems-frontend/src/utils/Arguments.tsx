import * as QueryString from "query-string";

export interface Arguments {
  userId: string;
  rivals: Array<string>;
  kind: string;
  ranking: string;
}

export class ArgumentParser {
  static parse(): Arguments {
    let params = QueryString.parse(location.search);
    let userId: string = ("user" in params && typeof params["user"] == "string") ? params["user"].toString() : "";
    let rivals: string = ("rivals" in params && typeof params["rivals"] == "string") ? params["rivals"].toString() : "";
    let kind: string = ("kind" in params && typeof params["kind"] == "string") ? params["kind"].toString() : "category";
    let ranking: string = ("ranking" in params && typeof params["ranking"] == "string") ? params["ranking"].toString() : "ac";
    return {
      userId: userId,
      rivals: rivals.split(",").filter(r => r.length > 0),
      kind: kind,
      ranking: ranking
    };
  }
}

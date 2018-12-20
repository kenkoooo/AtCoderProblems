import * as QueryString from "query-string";
import { string } from "prop-types";

export interface Arguments {
  userId: string;
  rivals: Array<string>;
  kind: string;
  ranking: string;
}

export class ArgumentParser {
  static parse(): Arguments {
    let params = QueryString.parse(location.search);
    let userId: string = ("user" in params && params["user"] instanceof string) ? params["user"].toString() : "";
    let rivals: string = ("rivals" in params && params["rivals"] instanceof string) ? params["rivals"].toString() : "";
    let kind: string = ("kind" in params && params["kind"] instanceof string) ? params["kind"].toString() : "category";
    let ranking: string = ("ranking" in params && params["ranking"] instanceof string) ? params["ranking"].toString() : "ac";
    return {
      userId: userId,
      rivals: rivals.split(",").filter(r => r.length > 0),
      kind: kind,
      ranking: ranking
    };
  }
}

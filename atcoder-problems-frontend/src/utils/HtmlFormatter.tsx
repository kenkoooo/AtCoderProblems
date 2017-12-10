import * as React from "react";
import { Problem } from "../model/Problem";
import { Option } from "ts-option";

export class HtmlFormatter {
  /**
   * create hyperlink from url and link text
   * @param url reference url
   * @param text link text
   */
  static createLink(
    url: string,
    text: string,
    sameWindow?: boolean
  ): JSX.Element {
    let target = "_blank";
    if (sameWindow) {
      target = "";
    }
    return (
      <a href={url} target={target}>
        {text}
      </a>
    );
  }

  /**
   * get problem cell color defined by the result
   * @param problem problem to get color
   * @param acceptedProblems the set of accepted problem ids
   * @param rivalProblems the set of problem ids accepted by rivals
   * @param wrongMap the map of <wrong answered problem id, result>
   */
  static getCellColor(
    problem: Option<Problem>,
    acceptedProblems: Set<string>,
    rivalProblems: Set<string>,
    wrongMap: Map<string, any>
  ): string {
    return problem.match({
      some: p => {
        if (acceptedProblems.has(p.id)) {
          return "success";
        } else if (rivalProblems.has(p.id)) {
          return "danger";
        } else if (wrongMap.has(p.id)) {
          return "warning";
        } else {
          return "";
        }
      },
      none: () => ""
    });
  }
}

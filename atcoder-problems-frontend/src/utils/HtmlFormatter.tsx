import * as React from "react";

export class HtmlFormatter {
  /**
   * create hyperlink from url and link text
   * @param url reference url
   * @param text link text
   */
  static createLink(url: string, text: string): JSX.Element {
    return (
      <a href={url} target="_blank">
        {text}
      </a>
    );
  }
}

import React, { ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
}

export const NewTabLink = (props: Props) => (
  <a
    href={props.href}
    target="_blank" // eslint-disable-line react/jsx-no-target-blank
    rel="noopener"
  >
    {props.children}
  </a>
);

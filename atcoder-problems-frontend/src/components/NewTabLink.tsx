import React, { ReactNode } from "react";

interface Props extends React.HTMLAttributes<HTMLElement> {
  href: string;
  children: ReactNode;
  className?: string;
}

export const NewTabLink: React.FC<Props> = props => (
  <a
    href={props.href}
    target="_blank" // eslint-disable-line react/jsx-no-target-blank
    rel="noopener"
    className={props.className}
  >
    {props.children}
  </a>
);

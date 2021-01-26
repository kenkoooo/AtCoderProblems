import React, { ReactNode } from "react";

interface Props extends React.HTMLAttributes<HTMLElement> {
  href?: string;
  children: ReactNode;
  className?: string;
}

export const NewTabLink: React.FC<Props> = (props) => (
  // Don't add rel="noreferrer" to AtCoder links
  // to allow AtCoder get the referral information.
  // eslint-disable-next-line react/jsx-no-target-blank
  <a
    href={props.href}
    rel="noopener"
    // Don't add rel="noreferrer" to AtCoder links
    // to allow AtCoder get the referral information.
    // eslint-disable-next-line react/jsx-no-target-blank
    target="_blank"
    className={props.className}
  >
    {props.children}
  </a>
);

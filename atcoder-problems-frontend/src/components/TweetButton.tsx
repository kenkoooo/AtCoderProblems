import React from "react";
import { Button } from "reactstrap";

interface Props {
  title: string;
  id: string;
}

export default (props: Props) => {
  const internalUrl = `https://kenkoooo.com/atcoder/#/contest/show/${props.id}`;
  const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    internalUrl
  )}&text=${props.title}&hashtags=AtCoderProblems`;
  console.log(internalUrl);
  console.log(shareUrl);
  return <Button href={shareUrl}>Tweet</Button>;
};

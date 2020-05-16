import React from "react";
import { Button } from "reactstrap";

interface Props {
  title: string;
  id: string;
}

export const TweetButton: React.FC<Props> = props => {
  const internalUrl = `https://kenkoooo.com/atcoder/#/contest/show/${props.id}`;
  const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    internalUrl
  )}&text=${encodeURIComponent(props.title)}&hashtags=AtCoderProblems`;
  return (
    <Button
      href={shareUrl}
      rel="noopener noreferrer"
      target="_blank"
      color="primary"
    >
      Tweet
    </Button>
  );
};

import React from "react";
import { Button } from "reactstrap";

interface TweetButtonProps {
  title: string;
  id: string;
}

interface ShareitButtonProps extends TweetButtonProps {
  username: string;
  rank: number;
}

const internalUrl = (id: string) =>
  `https://kenkoooo.com/atcoder/#/contest/show/${id}`;
const shareUrl = (internalUrl: string, text: string) =>
  `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    internalUrl
  )}&text=${encodeURIComponent(text)}&hashtags=AtCoderProblems`;

function rankToString(rank: number) {
  const rankString = rank.toString();
  if (11 <= rank && rank <= 13) {
    return rankString + "th";
  } else {
    const digit1 = rank % 10;
    if (digit1 === 1) return rankString + "st";
    else if (digit1 === 2) return rankString + "nd";
    else if (digit1 === 3) return rankString + "rd";
    else return rankString + "th";
  }
}

export const TweetButton: React.FC<TweetButtonProps> = (props) => {
  return (
    <Button
      href={shareUrl(internalUrl(props.id), props.title)}
      rel="noopener noreferrer"
      target="_blank"
      color="primary"
    >
      Tweet
    </Button>
  );
};

export const ShareitButton: React.FC<ShareitButtonProps> = (props) => {
  const message = `${props.username} took ${rankToString(
    props.rank
  )} place in ${props.title}!`;
  return (
    <Button
      href={shareUrl(internalUrl(props.id), message)}
      rel="noopener noreferrer"
      target="_blank"
      color="link"
    >
      Share it!
    </Button>
  );
};

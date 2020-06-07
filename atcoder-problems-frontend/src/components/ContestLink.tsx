import React from "react";
import * as Url from "../utils/Url";
import Contest from "../interfaces/Contest";
import { AGC_001_START } from "../pages/TablePage/ContestClassifier";
import { getRatingColorClass } from "../utils";
import { NewTabLink } from "./NewTabLink";

interface Props {
  contest: Contest;
  title?: string;
}

export enum RatedTargetType {
  All,
  Unrated,
}

type RatedTarget = number | RatedTargetType;

export function getRatedTarget(contest: Contest): RatedTarget {
  if (AGC_001_START > contest.start_epoch_second) {
    return RatedTargetType.Unrated;
  }
  switch (contest.rate_change) {
    case undefined:
      return RatedTargetType.Unrated;
    case "-":
      return RatedTargetType.Unrated;
    case "All":
      return RatedTargetType.All;
    default: {
      const range = contest.rate_change.split("~").map((r) => r.trim());
      if (range.length !== 2) {
        return RatedTargetType.Unrated;
      }
      const upperBound = parseInt(range[1]);
      if (upperBound) {
        return upperBound;
      }
      const lowerBound = parseInt(range[0]);
      if (lowerBound) {
        return RatedTargetType.All;
      }
      return RatedTargetType.Unrated;
    }
  }
}

function getColorClass(target: RatedTarget): string {
  if (target === RatedTargetType.All) {
    return "difficulty-red";
  }
  if (target === RatedTargetType.Unrated) {
    return "";
  }
  return getRatingColorClass(target);
}

const ContestLink: React.FC<Props> = (props) => {
  const { contest, title } = props;
  const target: RatedTarget = getRatedTarget(contest);

  return (
    <>
      <span className={getColorClass(target)}>◉</span>{" "}
      <NewTabLink href={Url.formatContestUrl(contest.id)}>
        {title !== undefined ? title : contest.title}
      </NewTabLink>
    </>
  );
};

export default ContestLink;

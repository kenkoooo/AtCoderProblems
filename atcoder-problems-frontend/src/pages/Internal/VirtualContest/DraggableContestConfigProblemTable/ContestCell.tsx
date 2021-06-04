import React from "react";
import { ContestLink } from "../../../../components/ContestLink";
import * as Url from "../../../../utils/Url";
import { ProblemRowData } from "./index";

type ContestCellProps = Pick<ProblemRowData, "problem" | "contest">;
export const ContestCell: React.FC<ContestCellProps> = ({
  problem,
  contest,
}) => {
  return (
    <td style={{ width: "40%" }}>
      {contest ? (
        <ContestLink contest={contest} />
      ) : (
        <>
          {problem ? (
            <a
              href={Url.formatContestUrl(problem.contest_id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {problem.title}
            </a>
          ) : null}
        </>
      )}
    </td>
  );
};

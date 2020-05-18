import Submission from "../interfaces/Submission";
import ProblemModel from "../interfaces/ProblemModel";
// import { ListPaginationPanel } from "./ListPaginationPanel";
import { formatMomentDateTime, parseSecond } from "../utils/DateUtil";
import ProblemLink from "./ProblemLink";
import { isAccepted } from "../utils";
import { Badge } from "reactstrap";
import * as Url from "../utils/Url";
import React from "react";
import { ProblemId } from "../interfaces/Status";
import { NewTabLink } from "./NewTabLink";
import { ReactBootstrapTable } from "./ReactBootstrapTable";
import { selectFilter } from "react-bootstrap-table2-filter";

interface Props {
  submissions: Submission[];
  problems: { id: string; title: string }[];
  problemModels: Map<ProblemId, ProblemModel>;
}

export const SubmissionListTable: React.FC<Props> = (props) => {
  const { submissions, problems, problemModels } = props;
  const titleMap = problems.reduce((map, p) => {
    map.set(p.id, p.title);
    return map;
  }, new Map<string, string>());

  const verdictOptions: { [_: string]: string } = Array.from(
    submissions.reduce((set, s) => {
      set.add(s.result);
      return set;
    }, new Set<string>())
  )
    .sort()
    .reduce((options, s) => {
      options[s] = s;
      return options;
    }, {} as { [_: string]: string });

  const languageOptions: { [_: string]: string } = Array.from(
    submissions.reduce((set, s) => {
      set.add(s.language);
      return set;
    }, new Set<string>())
  )
    .sort()
    .reduce((options, s) => {
      options[s] = s;
      return options;
    }, {} as { [_: string]: string });

  return (
    <ReactBootstrapTable
      striped
      hover
      sizePerPage={20}
      data={submissions
        .sort((a, b) => b.epoch_second - a.epoch_second)
        .map((s) => ({ title: titleMap.get(s.problem_id), ...s }))}
      keyField="id"
      useSearch
      usePagination
      useBinaryPagination
      columns={[
        {
          dataField: "epoch_second",
          headerAlign: "left",
          sort: true,
          text: "Date",
          formatter: (second: number): string =>
            formatMomentDateTime(parseSecond(second)),
        },
        {
          dataField: "title",
          headerAlign: "left",
          sort: true,
          text: "Problem",
          formatter: function Formatter(
            title: string | undefined,
            { problem_id, contest_id }: Submission
          ): React.ReactElement {
            return (
              <ProblemLink
                difficulty={problemModels.get(problem_id)?.difficulty}
                isExperimentalDifficulty={
                  problemModels.get(problem_id)?.is_experimental
                }
                showDifficulty={true}
                problemId={problem_id}
                problemTitle={title || ""}
                contestId={contest_id}
              />
            );
          },
        },
        {
          dataField: "user_id",
          headerAlign: "left",
          sort: true,
          text: "User",
          formatter: function Formatter(userId: string): React.ReactElement {
            return (
              <NewTabLink href={Url.formatUserUrl(userId)}>{userId}</NewTabLink>
            );
          },
        },
        {
          dataField: "result",
          headerAlign: "left",
          sort: true,
          align: "center",
          text: "Status",
          filter: selectFilter({ options: verdictOptions }),
          formatter: function Formatter(result): React.ReactElement {
            return isAccepted(result) ? (
              <Badge color="success">{result}</Badge>
            ) : (
              <Badge color="warning">{result}</Badge>
            );
          },
        },
        {
          dataField: "language",
          headerAlign: "left",
          sort: true,
          text: "Language",
          filter: selectFilter({ options: languageOptions }),
        },
        {
          dataField: "id",
          headerAlign: "left",
          sort: true,
          text: "Detail",
          formatter: function Formatter(
            _: number,
            { id, contest_id }: Submission
          ): React.ReactElement {
            return (
              <NewTabLink href={Url.formatSubmissionUrl(id, contest_id)}>
                Detail
              </NewTabLink>
            );
          },
        },
        {
          dataField: "title",
          headerAlign: "left",
          hidden: true,
          text: "Title",
        },
      ]}
    />
  );
};

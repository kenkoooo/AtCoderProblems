import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Badge } from "reactstrap";
import React from "react";
import { useProblemModelMap, useProblems } from "../api/APIClient";
import Submission from "../interfaces/Submission";
import { formatMomentDateTime, parseSecond } from "../utils/DateUtil";
import { isAccepted } from "../utils";
import * as Url from "../utils/Url";
import { RatingInfo } from "../utils/RatingInfo";
import { ProblemLink } from "./ProblemLink";
import {
  ListPaginationPanel,
  ListPaginationPanelProps,
} from "./ListPaginationPanel";
import { NewTabLink } from "./NewTabLink";

interface Props {
  submissions: Submission[];
  userRatingInfo?: RatingInfo;
}

export const SubmissionListTable: React.FC<Props> = (props) => {
  const { submissions, userRatingInfo } = props;
  const problems = useProblems() ?? [];
  const problemModels = useProblemModelMap();
  const [problemIndexMap, nameMap] = problems.reduce(
    ([problemIndexMap, nameMap], p) => {
      problemIndexMap.set(p.id, p.problem_index);
      nameMap.set(p.id, p.name);
      return [problemIndexMap, nameMap];
    },
    [new Map<string, string>(), new Map<string, string>()]
  );

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
    <BootstrapTable
      data={submissions
        .sort((a, b) => b.epoch_second - a.epoch_second)
        .map((s) => ({
          problemIndex: problemIndexMap.get(s.problem_id) ?? "",
          name: nameMap.get(s.problem_id) ?? "",
          ...s,
        }))}
      keyField="id"
      height="auto"
      hover
      striped
      search
      pagination
      options={{
        paginationPosition: "top",
        sizePerPage: 20,
        sizePerPageList: [
          {
            text: "20",
            value: 20,
          },
          {
            text: "50",
            value: 50,
          },
          {
            text: "100",
            value: 100,
          },
          {
            text: "200",
            value: 200,
          },
          {
            text: "All",
            value: submissions.length,
          },
        ],
        paginationPanel: function DataFormat(
          paginationPanelProps: ListPaginationPanelProps
        ): React.ReactElement {
          return <ListPaginationPanel {...paginationPanelProps} />;
        },
      }}
    >
      <TableHeaderColumn
        dataSort
        dataField="epoch_second"
        dataFormat={(second: number): string =>
          formatMomentDateTime(parseSecond(second))
        }
      >
        Date
      </TableHeaderColumn>
      <TableHeaderColumn
        filterFormatted
        dataSort
        dataField="name"
        dataFormat={(
          name: string | undefined,
          { problem_id, contest_id }: Submission
        ): React.ReactElement => (
          <ProblemLink
            isExperimentalDifficulty={
              problemModels?.get(problem_id)?.is_experimental
            }
            showDifficulty={true}
            problemId={problem_id}
            problemIndex={problemIndexMap.get(problem_id) || ""}
            problemName={name || ""}
            contestId={contest_id}
            problemModel={problemModels?.get(problem_id) ?? null}
            userRatingInfo={userRatingInfo}
          />
        )}
      >
        Problem
      </TableHeaderColumn>
      <TableHeaderColumn
        dataSort
        dataField="user_id"
        dataFormat={(userId: string): React.ReactElement => (
          <NewTabLink href={Url.formatUserUrl(userId)}>{userId}</NewTabLink>
        )}
      >
        User
      </TableHeaderColumn>
      <TableHeaderColumn
        dataSort
        filter={{ type: "SelectFilter", options: verdictOptions }}
        dataField="result"
        dataAlign="center"
        dataFormat={(result): React.ReactElement =>
          isAccepted(result) ? (
            <Badge color="success">{result}</Badge>
          ) : (
            <Badge color="warning">{result}</Badge>
          )
        }
      >
        Status
      </TableHeaderColumn>
      <TableHeaderColumn
        dataSort
        dataField="language"
        filter={{ type: "SelectFilter", options: languageOptions }}
      >
        Language
      </TableHeaderColumn>
      <TableHeaderColumn
        dataSort
        dataField="id"
        dataFormat={(
          _: number,
          { id, contest_id }: Submission
        ): React.ReactElement => (
          <NewTabLink href={Url.formatSubmissionUrl(id, contest_id)}>
            Detail
          </NewTabLink>
        )}
      >
        Detail
      </TableHeaderColumn>
      <TableHeaderColumn dataField="title" hidden />
    </BootstrapTable>
  );
};

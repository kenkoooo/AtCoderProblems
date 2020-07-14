import { List, Map as ImmutableMap, Set } from "immutable";
import { Row, Table } from "reactstrap";
import React from "react";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import { ProblemId, ProblemStatus, StatusLabel } from "../../interfaces/Status";
import { ColorMode, statusToTableColor } from "../../utils/TableColor";
import { ProblemLink } from "../../components/ProblemLink";
import { ContestLink } from "../../components/ContestLink";
import ProblemModel from "../../interfaces/ProblemModel";
import { SubmitTimespan } from "../../components/SubmitTimespan";
import { isRatedContest } from "./ContestClassifier";

interface Props {
  contests: Contest[];
  contestToProblems: ImmutableMap<string, List<Problem>>;
  showSolved: boolean;
  showDifficulty: boolean;
  colorMode: ColorMode;
  problemModels: ImmutableMap<ProblemId, ProblemModel>;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  showPenalties: boolean;
  selectedLanguages: Set<string>;
  title: string;
}

export const ContestTable: React.FC<Props> = (props) => {
  const {
    contests,
    contestToProblems,
    showSolved,
    statusLabelMap,
    colorMode,
    problemModels,
    showPenalties,
    selectedLanguages,
  } = props;
  const mergedContests = contests
    .sort((a, b) => b.start_epoch_second - a.start_epoch_second)
    .map((contest) => ({
      contest,
      problems: contestToProblems
        .get(contest.id, List<Problem>())
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .map(({ contest, problems }) => {
      const problemStatus = problems.map((p) => ({
        problem: p,
        status: statusLabelMap.get(p.id),
      }));
      return { contest, problemStatus };
    })
    .filter(
      ({ problemStatus }) =>
        showSolved ||
        !problemStatus.every(
          ({ status }) => !!status && status.label === StatusLabel.Success
        )
    )
    .map(({ contest, problemStatus }) => {
      const problemInfo = problemStatus.map(({ problem, status }) => {
        const model = problemModels.get(problem.id);
        return { problem, status, model };
      });
      return { contest, problemInfo };
    });
  return (
    <>
      <Row className="my-4">
        <h2>{props.title}</h2>
      </Row>
      <div>
        {mergedContests.map(({ contest, problemInfo }) => {
          return (
            <div key={contest.id} className="contest-table-responsive">
              <strong>
                <ContestLink contest={contest} />
              </strong>
              <Table striped bordered hover responsive>
                <tbody>
                  <tr>
                    {problemInfo.map(({ problem, status, model }) => {
                      const color = status
                        ? statusToTableColor({
                            colorMode,
                            status,
                            contest,
                            selectedLanguages,
                          })
                        : "";
                      return (
                        <td
                          key={problem.id}
                          className={["table-problem", color]
                            .filter((nm) => nm)
                            .join(" ")}
                        >
                          <ProblemLink
                            difficulty={
                              model && model.difficulty
                                ? model.difficulty
                                : null
                            }
                            isExperimentalDifficulty={
                              model ? model.is_experimental : false
                            }
                            showDifficultyUnavailable={isRatedContest(contest)}
                            showDifficulty={props.showDifficulty}
                            problemId={problem.id}
                            problemTitle={problem.title}
                            contestId={problem.contest_id}
                          />
                          {props.colorMode === ColorMode.ContestResult && (
                            <SubmitTimespan
                              contest={contest}
                              problemStatus={status}
                              showPenalties={showPenalties}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </Table>
            </div>
          );
        })}
      </div>
    </>
  );
};

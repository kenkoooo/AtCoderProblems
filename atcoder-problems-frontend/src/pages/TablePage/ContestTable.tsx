import { Row, Table } from "reactstrap";
import React from "react";
import { useProblemModelMap } from "../../api/APIClient";
import Contest from "../../interfaces/Contest";
import MergedProblem from "../../interfaces/MergedProblem";
import { ProblemId, ProblemStatus, StatusLabel } from "../../interfaces/Status";
import { ColorMode, statusToTableColor } from "../../utils/TableColor";
import { ProblemLink } from "../../components/ProblemLink";
import { ContestLink } from "../../components/ContestLink";
import { SubmitTimespan } from "../../components/SubmitTimespan";
import { RatingInfo } from "../../utils/RatingInfo";
import { isRatedContest } from "../../utils/ContestClassifier";
import { ProblemPoint } from "../../components/Problempoint";

interface Props {
  contests: Contest[];
  contestToProblems: Map<string, MergedProblem[]>;
  hideCompletedContest: boolean;
  showDifficulty: boolean;
  colorMode: ColorMode;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  showPenalties: boolean;
  selectedLanguages: Set<string>;
  title: string;
  userRatingInfo: RatingInfo;
}

export const convertProblemTitleForSorting = (
  title: string
): [string, number] => {
  const idx = title.split(".")[0];
  const str = idx.replace(/[0-9]/g, "");
  const num = parseInt(idx.replace(/[^0-9]/g, ""), 10);
  return [str, num];
};

export const ContestTable: React.FC<Props> = (props) => {
  const {
    contests,
    contestToProblems,
    hideCompletedContest,
    statusLabelMap,
    colorMode,
    showPenalties,
    selectedLanguages,
    userRatingInfo,
  } = props;
  const problemModels = useProblemModelMap();
  const mergedContests = contests
    .sort((a, b) => b.start_epoch_second - a.start_epoch_second)
    .map((contest) => ({
      contest,
      problems: (contestToProblems.get(contest.id) ?? []).sort((a, b) => {
        const [str_a, num_a] = convertProblemTitleForSorting(a.title);
        const [str_b, num_b] = convertProblemTitleForSorting(b.title);
        const cmp = str_a.localeCompare(str_b);
        return cmp === 0 ? num_a - num_b : cmp;
      }),
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
        !hideCompletedContest ||
        !problemStatus.every(
          ({ status }) => !!status && status.label === StatusLabel.Success
        )
    )
    .map(({ contest, problemStatus }) => {
      const problemInfo = problemStatus.map(({ problem, status }) => {
        const model = problemModels?.get(problem.id);
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
                      const INF_POINT = 1e18;
                      const point = problem.point ?? INF_POINT;
                      return (
                        <td
                          key={problem.id}
                          className={["table-problem", color]
                            .filter((nm) => nm)
                            .join(" ")}
                        >
                          <ProblemLink
                            isExperimentalDifficulty={
                              model ? model.is_experimental : false
                            }
                            showDifficultyUnavailable={isRatedContest(
                              contest,
                              problemInfo.length
                            )}
                            showDifficulty={props.showDifficulty}
                            problemId={problem.id}
                            problemTitle={problem.title}
                            contestId={problem.contest_id}
                            problemModel={model}
                            userRatingInfo={userRatingInfo}
                          />
                          {props.colorMode === ColorMode.None && (
                            <ProblemPoint point={point} />
                          )}
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

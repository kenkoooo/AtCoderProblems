import React from "react";
import { Card, CardBody, Col, Row } from "reactstrap";
import { ProblemLink } from "../../../components/ProblemLink";
import { HelpBadgeModal } from "../../../components/HelpBadgeModal";
import {
  formatPredictedSolveProbability,
  formatPredictedSolveTime,
} from "../../../utils/ProblemModelUtil";
import { ProblemId } from "../../../interfaces/Status";
import Problem from "../../../interfaces/Problem";
import { RecommendedProblem } from "./RecommendProblems";

interface Props {
  filteredRecommendedProblems: RecommendedProblem[];
  getSelectedProblemIds: () => ProblemId[];
  selectProblemIds: (ids: ProblemId[]) => void;
  deselectProblemIds: (ids: ProblemId[]) => void;
  formatProblemName: (
    title: string,
    {
      id,
      contest_id,
      is_experimental,
    }: { id: string; contest_id: string; is_experimental: boolean }
  ) => React.ReactElement;
  formatContestName: (
    contestId: string,
    problem: Problem
  ) => React.ReactElement;
}

export const RecommendGrid = (props: Props) => {
  return (
    <Row className="justify-content-center">
      {props.filteredRecommendedProblems.length === 0 ? (
        <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
          No problems!
        </span>
      ) : (
        props.filteredRecommendedProblems.map((p) => {
          return (
            <Col key={p.id} className="text-center my-1" md="4" sm="6" xs="12">
              <Card>
                <CardBody>
                  <ProblemLink
                    problemId={p.id}
                    contestId={p.contest_id}
                    problemTitle={p.title}
                  />
                  &nbsp;
                  <HelpBadgeModal id={`ProblemBadge-${p.id}`} title={p.title}>
                    <div className="text-center">
                      {props.formatProblemName(p.title, p)}
                      <br />
                      {props.formatContestName(p.contest_id, p)}
                      <br />
                      Difficulty: {p.difficulty}
                      <br />
                      Predicted Solve Probability:{" "}
                      {formatPredictedSolveProbability(
                        p.predictedSolveProbability
                      )}
                      <br />
                      Predicted Solve Time:{" "}
                      {formatPredictedSolveTime(p.predictedSolveTime)}
                      <br />
                    </div>
                  </HelpBadgeModal>
                </CardBody>
              </Card>
            </Col>
          );
        })
      )}
    </Row>
  );
};

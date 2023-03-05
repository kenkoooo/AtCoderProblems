import React from "react";
import { Card, CardBody, Col, Input, Label, Row } from "reactstrap";
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
  isLoggedIn: boolean;
  isProblemIdSelected: (id: ProblemId) => boolean;
  selectProblemIds: (ids: ProblemId[]) => void;
  deselectProblemIds: (ids: ProblemId[]) => void;
  formatProblemName: (
    name: string,
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
                  {props.isLoggedIn ? (
                    <Label check>
                      <Input
                        type="checkbox"
                        checked={props.isProblemIdSelected(p.id)}
                        onClick={() => {
                          if (props.isProblemIdSelected(p.id)) {
                            props.deselectProblemIds([p.id]);
                          } else {
                            props.selectProblemIds([p.id]);
                          }
                        }}
                      />
                      <ProblemLink
                        problemId={p.id}
                        contestId={p.contest_id}
                        problemName={p.name}
                      />
                    </Label>
                  ) : (
                    <ProblemLink
                      problemId={p.id}
                      contestId={p.contest_id}
                      problemName={p.name}
                    />
                  )}
                  &nbsp;
                  <HelpBadgeModal id={`ProblemBadge-${p.id}`} title={p.name}>
                    <div className="text-center">
                      {props.formatProblemName(p.name, p)}
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

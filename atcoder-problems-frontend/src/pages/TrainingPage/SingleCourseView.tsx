import React from "react";
import { Container, Row, Table, Nav, NavItem, NavLink, Col } from "reactstrap";
import { GoCheck, GoSearch } from "react-icons/go";
import { Link } from "react-router-dom";
import { useProblemMap, useProblemModelMap } from "../../api/APIClient";
import { Course } from "../../interfaces/Course";
import Problem from "../../interfaces/Problem";
import Submission from "../../interfaces/Submission";
import { isAccepted } from "../../utils";
import { NewTabLink } from "../../components/NewTabLink";
import * as Url from "../../utils/Url";
import { ProblemLink } from "../../components/ProblemLink";
import { SinglePieChart } from "../../components/SinglePieChart";
import { ShowDifficultyMode } from "../../utils/ShowDifficultyMode";

interface ProblemTableProps {
  problems: Problem[];
  submissions: Submission[];
}

const ProblemTable: React.FC<ProblemTableProps> = (props) => {
  const problemModels = useProblemModelMap();
  const latestAcceptedSubmissionMap = props.submissions
    .filter((s) => isAccepted(s.result))
    .reduce((map, s) => {
      map.set(s.problem_id, s);
      return map;
    }, new Map<string, Submission>());

  return (
    <Table striped hover>
      <thead>
        <tr>
          <th style={{ width: "10%", textAlign: "right" }}>#</th>
          <th style={{ width: "10%" }}>Status</th>
          <th>Problem</th>
          <th style={{ width: "10%" }}>Solution</th>
        </tr>
      </thead>
      <tbody>
        {props.problems.map((problem, i) => {
          const submission = latestAcceptedSubmissionMap.get(problem.id);
          const model = problemModels?.get(problem.id);
          return (
            <tr key={i}>
              <th scope="row" style={{ width: "10%", textAlign: "right" }}>
                {i + 1}
              </th>
              <td className="text-success">
                {submission ? <GoCheck /> : null}
              </td>
              <td>
                <ProblemLink
                  problemId={problem.id}
                  problemIndex={problem.problem_index}
                  problemName={problem.name}
                  contestId={problem.contest_id}
                  problemModel={model}
                  isExperimentalDifficulty={!!model && model.is_experimental}
                  showDifficultyMode={
                    submission !== undefined
                      ? ShowDifficultyMode.Full
                      : ShowDifficultyMode.None
                  }
                  showDifficultyUnavailable
                />
              </td>
              <td>
                {submission ? (
                  <NewTabLink
                    href={Url.formatSubmissionUrl(
                      submission.id,
                      submission.contest_id
                    )}
                  >
                    <GoSearch />
                  </NewTabLink>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

interface SetPieChartProps {
  title: string;
  solved: number;
  total: number;
}

const SetPieChart: React.FC<SetPieChartProps> = (props) => {
  const data = [
    { value: props.solved, color: "#32cd32", name: "AC" },
    { value: props.total - props.solved, color: "#58616a", name: "NoSub" },
  ];
  return (
    <div>
      <SinglePieChart data={data} />
      <h5>{props.title}</h5>
    </div>
  );
};

interface OuterProps {
  course: Course;
  selectedSet: number;
  submissions: Submission[];
}

export const SingleCourseView: React.FC<OuterProps> = (props) => {
  const { course, selectedSet } = props;
  const problemSet = course.set_list;
  problemSet.sort((a, b) => a.order - b.order);
  const currentSelectedSet =
    problemSet.find((set) => set.order === selectedSet)?.problems ?? [];
  currentSelectedSet.sort((a, b) => a.order - b.order);

  const submissions = props.submissions;
  const acceptedProblemIds = submissions
    .filter((s) => isAccepted(s.result))
    .reduce((set, s) => {
      set.add(s.problem_id);
      return set;
    }, new Set<string>());

  const problemMap = useProblemMap();
  const problems = currentSelectedSet
    .map((entry) => problemMap?.get(entry.problem_id))
    .filter(
      (problem: Problem | undefined): problem is Problem =>
        problem !== undefined
    );
  return (
    <Container fluid>
      <Row className="my-2">
        <h2>{course.title}</h2>
      </Row>
      <Row className="my-2">
        {problemSet.map((set, i) => (
          <Col
            key={i}
            className="text-center"
            xs="6"
            md={12 / problemSet.length}
          >
            <SetPieChart
              title={set.title}
              solved={
                set.problems.filter((p) => acceptedProblemIds.has(p.problem_id))
                  .length
              }
              total={set.problems.length}
            />
          </Col>
        ))}
      </Row>
      <Nav tabs>
        {problemSet.map((set, i) => (
          <NavItem key={i}>
            <NavLink
              active={selectedSet === set.order}
              tag={Link}
              to={`/training/${course.title}/${set.order}`}
              style={{ color: "black" }}
            >
              <h3>{set.title}</h3>
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <Row>
        <ProblemTable problems={problems} submissions={submissions} />
      </Row>
    </Container>
  );
};

import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import { Container, Row, Table, Nav, NavItem, NavLink, Col } from "reactstrap";
import Octicon, { Check, Search } from "@primer/octicons-react";
import { Course } from "../../interfaces/Course";
import Problem from "../../interfaces/Problem";
import { ProblemId } from "../../interfaces/Status";
import { cachedProblemMap } from "../../utils/CachedApiClient";
import { convertMap } from "../../utils/ImmutableMigration";
import Submission from "../../interfaces/Submission";
import { isAccepted } from "../../utils";
import { NewTabLink } from "../../components/NewTabLink";
import * as Url from "../../utils/Url";
import ProblemLink from "../../components/ProblemLink";
import { SinglePieChart } from "../../components/SinglePieChart";

interface ProblemTableProps {
  problems: Problem[];
  submissions: Submission[];
}

const ProblemTable: React.FC<ProblemTableProps> = (props) => {
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
          return (
            <tr key={i}>
              <th scope="row" style={{ width: "10%", textAlign: "right" }}>
                {i + 1}
              </th>
              <td className="text-success">
                {submission ? <Octicon icon={Check} /> : null}
              </td>
              <td>
                <ProblemLink
                  problemId={problem.id}
                  problemTitle={problem.title}
                  contestId={problem.contest_id}
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
                    <Octicon icon={Search} />
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
    { value: props.solved, color: "#32cd32", name: "Accepted" },
    { value: props.total - props.solved, color: "#58616a", name: "Trying" },
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
  submissions: Submission[];
}

interface InnerProps extends OuterProps {
  problems: PromiseState<Map<ProblemId, Problem>>;
}

const InnerSingleCourseView: React.FC<InnerProps> = (props) => {
  const { course } = props;
  const [selectedSet, setSelectedSet] = useState(course.set_list[0].order);

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

  const problemMap = props.problems.fulfilled
    ? props.problems.value
    : undefined;
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
              onClick={(): void => setSelectedSet(set.order)}
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

export const SingleCourseView = connect<OuterProps, InnerProps>(() => ({
  problems: {
    comparison: null,
    value: (): Promise<Map<string, Problem>> =>
      cachedProblemMap().then((map) => convertMap(map)),
  },
}))(InnerSingleCourseView);

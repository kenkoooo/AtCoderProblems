import React from "react";
import { Course } from "../../interfaces/Course";
import { Container, Row, Button, Jumbotron, Badge } from "reactstrap";
import { Link, useRouteMatch } from "react-router-dom";

interface Props {
  courses: Course[];
}

export const TrainingList = (props: Props) => {
  const { url } = useRouteMatch();
  return (
    <Container fluid>
      <Row>
        <h2>Training</h2>
      </Row>
      {props.courses.map((course, i) => (
        <Jumbotron key={i} fluid>
          <Container fluid>
            <h3 className="display-4">{course.title}</h3>
            <p className="lead">
              {course.set_list.length} sets /{" "}
              {course.set_list
                .map(s => s.problems.length)
                .reduceRight((a, b) => a + b)}{" "}
              problems
            </p>
            <ul>
              {course.set_list.map((set, j) => (
                <li key={j} className="lead">
                  {set.title} <Badge>{set.problems.length}</Badge>
                </li>
              ))}
            </ul>
            <p className="lead">
              <Button
                size="lg"
                color="success"
                tag={Link}
                to={`${url}/${course.title}`}
              >
                Challenge
              </Button>
            </p>
          </Container>
        </Jumbotron>
      ))}
    </Container>
  );
};

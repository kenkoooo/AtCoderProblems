import React from "react";
import { Course } from "../../interfaces/Course";
import { Container, Row, Table } from "reactstrap";
import { Link, useRouteMatch } from "react-router-dom";

interface Props {
  courses: Course[];
}

export const CourseList = (props: Props) => {
  const { url } = useRouteMatch();
  return (
    <Container fluid>
      <Row>
        <h2>Courses</h2>
      </Row>
      <Row>
        <Table>
          <thead>
            <tr>
              <th>Title</th>
            </tr>
          </thead>
          <tbody>
            {props.courses.map((course, i) => (
              <tr key={i}>
                <td>
                  <Link to={`${url}/${course.title}`}>{course.title}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Row>
    </Container>
  );
};

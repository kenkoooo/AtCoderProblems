import React from "react";
import { loadCourses } from "../../utils/StaticDataStorage";
import { connect, PromiseState } from "react-refetch";
import { Course } from "../../interfaces/Course";
import { Alert, Spinner } from "reactstrap";
import { useRouteMatch, Switch, Route } from "react-router-dom";
import { TrainingList } from "./TrainingList";
import { SingleCourseView } from "./SingleCourseView";

interface Props {
  courses: PromiseState<Course[]>;
}

const InnerTrainingList = (props: Props) => {
  const { path } = useRouteMatch();

  if (props.courses.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }
  if (props.courses.rejected) {
    return <Alert color="danger">Failed to fetch course info.</Alert>;
  }

  const courses = props.courses.value;
  return (
    <Switch>
      <Route exact path={path}>
        <TrainingList courses={courses} />
      </Route>
      <Route
        path={`${path}/:courseTitle`}
        render={({ match }) => {
          const courseTitle = match.params.courseTitle;
          const course = courses.find(c => c.title === courseTitle);
          return course ? <SingleCourseView course={course} /> : null;
        }}
      />
    </Switch>
  );
};

export const TrainingPage = connect<{}, Props>(() => ({
  courses: {
    comparison: null,
    value: () => loadCourses()
  }
}))(InnerTrainingList);

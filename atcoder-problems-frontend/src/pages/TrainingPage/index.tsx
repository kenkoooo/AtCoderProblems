import React from "react";
import { connect, PromiseState } from "react-refetch";
import { Alert, Spinner } from "reactstrap";
import { useRouteMatch, Switch, Route } from "react-router-dom";
import { useHistory } from "react-router";
import { Course } from "../../interfaces/Course";
import { loadCourses } from "../../utils/StaticDataStorage";
import { UserResponse } from "../Internal/types";
import { USER_GET } from "../Internal/ApiUrl";
import Submission from "../../interfaces/Submission";
import { cachedSubmissions } from "../../utils/CachedApiClient";
import { TrainingList } from "./TrainingList";
import { SingleCourseView } from "./SingleCourseView";
import { LoginAdvice } from "./LoginAdvice";

interface Props {
  courses: PromiseState<Course[]>;
  progress: PromiseState<{
    user: UserResponse | undefined;
    submissions: Submission[];
  }>;
}

const InnerTrainingList: React.FC<Props> = (props) => {
  const { path } = useRouteMatch();
  const history = useHistory();
  if (props.courses.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }
  if (props.courses.rejected) {
    return <Alert color="danger">Failed to fetch course info.</Alert>;
  }

  const { user, submissions } = props.progress.fulfilled
    ? props.progress.value
    : { user: undefined, submissions: [] };
  const loading = props.progress.pending;

  const courses = props.courses.value;
  return (
    <>
      <LoginAdvice user={user} loading={loading} />
      <Switch>
        <Route exact path={path}>
          <TrainingList submissions={submissions} courses={courses} />
        </Route>
        <Route
          path={`${path}/:courseTitle/:setListOrder?`}
          render={({ match }): React.ReactNode => {
            const courseTitle = match.params.courseTitle;
            const setListOrder = match.params.setListOrder;
            const course = courses.find((c) => c.title === courseTitle);
            if (course) {
              const defaultSetListOrder = course.set_list[0].order;
              const selectedSet =
                course.set_list.find((set) => setListOrder === `${set.order}`)
                  ?.order ?? defaultSetListOrder;
              return (
                <SingleCourseView
                  submissions={submissions}
                  course={course}
                  selectedSet={selectedSet}
                />
              );
            } else {
              return null;
            }
          }}
        />
      </Switch>
    </>
  );
};

export const TrainingPage = connect<{}, Props>(() => ({
  courses: {
    comparison: null,
    value: (): Promise<Course[]> => loadCourses(),
  },
  progress: {
    comparison: null,
    value: (): Promise<{
      user?: UserResponse | null;
      submissions: Submission[];
    }> =>
      fetch(USER_GET)
        .then((response) => response.json())
        .then((user: UserResponse | null) => {
          if (user && user.atcoder_user_id) {
            return cachedSubmissions(user.atcoder_user_id)
              .then((list) => list.toArray())
              .then((submissions) => ({
                user,
                submissions,
              }));
          } else if (user) {
            return { user, submissions: [] as Submission[] };
          } else {
            return {
              user: undefined,
              submissions: [] as Submission[],
            };
          }
        }),
  },
}))(InnerTrainingList);

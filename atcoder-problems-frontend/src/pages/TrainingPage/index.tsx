import React from "react";
import { Alert, Spinner } from "reactstrap";
import { useRouteMatch, Switch, Route } from "react-router-dom";
import { useUserSubmission } from "../../api/APIClient";
import { useLoginState } from "../../api/InternalAPIClient";
import { useCourses } from "../../utils/StaticDataStorage";
import { TrainingList } from "./TrainingList";
import { SingleCourseView } from "./SingleCourseView";
import { LoginAdvice } from "./LoginAdvice";

export const TrainingPage = () => {
  const { path } = useRouteMatch();
  const courses = useCourses();
  const loginState = useLoginState();
  const submissions = useUserSubmission(loginState.data?.atcoder_user_id ?? "");
  if (courses.failed) {
    return <Alert color="danger">Failed to fetch course info.</Alert>;
  }
  if (!courses.data) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }
  const loading = !loginState.fulfilled || !submissions;

  return (
    <>
      <LoginAdvice user={loginState.data} loading={loading} />
      <Switch>
        <Route exact path={path}>
          <TrainingList
            submissions={submissions ?? []}
            courses={courses.data}
          />
        </Route>
        <Route
          path={`${path}/:courseTitle/:setListOrder?`}
          render={({ match }): React.ReactNode => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const params: { courseTitle: string; setListOrder?: string } =
              match.params;
            const courseTitle = params.courseTitle;
            const setListOrder = params.setListOrder;
            const course = courses.data?.find((c) => c.title === courseTitle);
            if (course) {
              const defaultSetListOrder = course.set_list[0].order;
              const selectedSet =
                course.set_list.find((set) => setListOrder === `${set.order}`)
                  ?.order ?? defaultSetListOrder;
              return (
                <SingleCourseView
                  submissions={submissions ?? []}
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

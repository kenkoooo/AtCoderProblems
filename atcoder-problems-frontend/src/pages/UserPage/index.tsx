import React from "react";
import { Alert, Nav, NavItem, NavLink, Row, Spinner } from "reactstrap";
import { NavLink as RouterLink, useLocation } from "react-router-dom";

import { List, Map as ImmutableMap } from "immutable";
import { connect, PromiseState } from "react-refetch";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { generatePathWithParams } from "../../utils/QueryString";
import { caseInsensitiveUserId } from "../../utils";
import Submission from "../../interfaces/Submission";
import { ProblemId } from "../../interfaces/Status";
import { UserNameLabel } from "../../components/UserNameLabel";
import { PieChartBlock } from "./PieChartBlock";
import { AchievementBlock } from "./AchievementBlock";
import { ProgressChartBlock } from "./ProgressChartBlock";
import { Recommendations } from "./Recommendations";
import { LanguageCount } from "./LanguageCount";
import { DifficultyPieChart } from "./DifficultyPieChart";
import { TrophyBlock } from "./TrophyBlock/TrophyBlock";
import { Submissions } from "./Submissions";

const userPageTabs = [
  "Achievement",
  "AtCoder Pie Charts",
  "Difficulty Pies",
  "Progress Charts",
  "Submissions",
  "Recommendation",
  "Languages",
  "Trophy",
  "All",
] as const;

const TAB_PARAM = "userPageTab";

type UserPageTab = typeof userPageTabs[number];

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  submissionsFetch: PromiseState<ImmutableMap<ProblemId, List<Submission>>>;
}

const InnerUserPage: React.FC<InnerProps> = (props) => {
  const location = useLocation();
  const param = new URLSearchParams(location.search).get(TAB_PARAM);
  const userPageTab: UserPageTab =
    userPageTabs.find((t) => t === param) || "Achievement";

  const { userId, submissionsFetch } = props;

  if (submissionsFetch.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }

  const submissions = submissionsFetch.fulfilled
    ? submissionsFetch.value
    : ImmutableMap<ProblemId, List<Submission>>();

  if (userId.length === 0 || submissions.isEmpty()) {
    return <Alert color="danger">User not found!</Alert>;
  }

  /* eslint-disable */
  const actualUserId = (() => {
    for (const subs of Array.from(submissions.values())) {
      for (const s of Array.from(subs)) {
        if (caseInsensitiveUserId(s.user_id) == userId) {
          return s.user_id;
        }
      }
    }
    return userId;
  })();
  /* eslint-disable */

  return (
    <div>
      <Row className="my-2 border-bottom">
        <UserNameLabel userId={actualUserId} big showRating />
      </Row>
      <Nav tabs>
        {userPageTabs.map((tab) => (
          <NavItem key={tab}>
            <NavLink
              tag={RouterLink}
              isActive={(): boolean => tab === userPageTab}
              to={generatePathWithParams(location, { [TAB_PARAM]: tab })}
            >
              {tab}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      {(userPageTab === "All" || userPageTab === "Achievement") && (
        <AchievementBlock userId={userId} />
      )}
      {(userPageTab === "All" || userPageTab === "AtCoder Pie Charts") && (
        <PieChartBlock userId={userId} />
      )}
      {(userPageTab === "All" || userPageTab === "Difficulty Pies") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Difficulty Pies</h1>
          </Row>
          <DifficultyPieChart userId={userId} />
        </>
      )}
      {(userPageTab === "All" || userPageTab === "Progress Charts") && (
        <ProgressChartBlock userId={userId} />
      )}
      {(userPageTab === "All" || userPageTab === "Submissions") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Submissions</h1>
          </Row>
          <Submissions userId={userId} />
        </>
      )}
      {(userPageTab === "All" || userPageTab === "Languages") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Languages</h1>
          </Row>
          <LanguageCount userId={userId} />
        </>
      )}
      {(userPageTab === "All" || userPageTab === "Trophy") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Trophy [beta]</h1>
          </Row>
          <TrophyBlock userId={userId} />
        </>
      )}
      {(userPageTab === "All" || userPageTab === "Recommendation") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Recommendation</h1>
          </Row>
          <Recommendations userId={userId} />
        </>
      )}
    </div>
  );
};

export const UserPage = connect<OuterProps, InnerProps>(({ userId }) => ({
  submissionsFetch: {
    comparison: userId,
    value: (): Promise<ImmutableMap<string, List<Submission>>> =>
      CachedApiClient.cachedUsersSubmissionMap(List([userId])),
  },
}))(InnerUserPage);

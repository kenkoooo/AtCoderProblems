import React from "react";
import { Alert, Nav, NavItem, NavLink, Row, Spinner } from "reactstrap";
import { NavLink as RouterLink, useLocation } from "react-router-dom";

import { useUserSubmission } from "../../api/APIClient";
import { generatePathWithParams } from "../../utils/QueryString";
import { UserNameLabel } from "../../components/UserNameLabel";
import { PieChartBlock } from "./PieChartBlock";
import { AchievementBlock } from "./AchievementBlock";
import { ProgressChartBlock } from "./ProgressChartBlock";
import { Recommendations } from "./Recommendations";
import { LanguageCount } from "./LanguageCount";
import { DifficultyPieChart } from "./DifficultyPieChart";
import { TrophyBlock } from "./TrophyBlock";
import { Submissions } from "./Submissions";
import { CategoryAchivement } from "./CategoryAchivement";

const userPageTabs = [
  "Achievement",
  "AtCoder Pie Charts",
  "Difficulty Pies",
  "Progress Charts",
  "Submissions",
  "Recommendation",
  "Languages",
  "Trophy",
  "Category Achivement",
  "All",
] as const;

const TAB_PARAM = "userPageTab";

type UserPageTab = typeof userPageTabs[number];

interface Props {
  userId: string;
}

export const UserPage = (props: Props) => {
  const location = useLocation();
  const param = new URLSearchParams(location.search).get(TAB_PARAM);
  const userPageTab: UserPageTab =
    userPageTabs.find((t) => t === param) || "Achievement";

  const { userId } = props;
  const submissions = useUserSubmission(userId);

  if (!submissions) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }

  if (userId.length === 0 || submissions.length === 0) {
    return <Alert color="danger">User not found!</Alert>;
  }

  const actualUserId = submissions[0].user_id;

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
      {(userPageTab === "All" || userPageTab === "Category Achivement") && (
        <>
          <Row className="my-2 border-bottom">
            <h1>Category Achivement</h1>
          </Row>
          <CategoryAchivement userId={userId} />
        </>
      )}
    </div>
  );
};

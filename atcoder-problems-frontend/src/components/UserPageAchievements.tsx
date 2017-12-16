import * as React from "react";
import { RankPair } from "../model/RankPair";
import { ApiCall } from "../utils/ApiCall";
import { Row, Col } from "react-bootstrap";
import { RankingKind } from "../model/RankingKind";
import { Submission } from "../model/Submission";
import { TimeFormatter } from "../utils/TimeFormatter";

interface UserPageAchievementsState {
  ac: Array<RankPair>;
  first: Array<RankPair>;
  fast: Array<RankPair>;
  short: Array<RankPair>;
  sums: Array<RankPair>;
}

export interface UserPageAchievementsProps {
  userId: string;
  acceptNewProblemSeconds: Array<number>;
}

interface Achievement {
  title: string;
  ranking: Array<RankPair>;
}

export class UserPageAchievements extends React.Component<
  UserPageAchievementsProps,
  UserPageAchievementsState
> {
  constructor(props: UserPageAchievementsProps) {
    super(props);
    this.state = { ac: [], first: [], fast: [], short: [], sums: [] };
  }

  componentWillMount() {
    ApiCall.getRanking(RankingKind.Accepted).then(ranking =>
      this.setState({ ac: ranking })
    );
    ApiCall.getRanking(RankingKind.Shortest).then(ranking =>
      this.setState({ short: ranking })
    );
    ApiCall.getRanking(RankingKind.First).then(ranking =>
      this.setState({ first: ranking })
    );
    ApiCall.getRanking(RankingKind.Fastest).then(ranking =>
      this.setState({ fast: ranking })
    );
    ApiCall.getRatedPointSumRanking().then(ranking =>
      this.setState({ sums: ranking })
    );
  }

  render() {
    let achievement: Array<Achievement> = [
      { title: "Accepted", ranking: this.state.ac },
      { title: "Shortest Codes", ranking: this.state.short },
      { title: "Fastest Codes", ranking: this.state.fast },
      { title: "First Acceptances", ranking: this.state.first },
      { title: "Rated Point Sum", ranking: this.state.sums }
    ];

    let longestStreak = 0;
    let currentStreak = 0;
    let lastAcceptedDate = "None";
    if (this.props.acceptNewProblemSeconds.length > 0) {
      currentStreak = 1;
      longestStreak = 1;
      lastAcceptedDate = TimeFormatter.getDateString(
        this.props.acceptNewProblemSeconds[0] * 1000
      );
    }

    this.props.acceptNewProblemSeconds.forEach((second, i) => {
      if (i > 0) {
        let lastSecond = this.props.acceptNewProblemSeconds[i - 1];
        let yesterday = TimeFormatter.getDateString(
          (second - 24 * 3600) * 1000
        );
        if (lastAcceptedDate === yesterday) {
          currentStreak += 1;
        } else if (lastAcceptedDate < yesterday) {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      lastAcceptedDate = TimeFormatter.getDateString(second * 1000);
    });
    longestStreak = Math.max(longestStreak, currentStreak);
    let yesterday = TimeFormatter.getDateString(
      new Date().getTime() - 24 * 3600 * 1000
    );
    if (lastAcceptedDate < yesterday) {
      currentStreak = 0;
    }

    return (
      <Row className="placeholders">
        {achievement.map(a => {
          var rank = 0;
          var count = 0;
          a.ranking.forEach(r => {
            if (r.userId === this.props.userId) {
              rank = r.rank;
              count = r.count;
            }
          });

          var rankTitle = "-";
          if (rank == 0) {
            rankTitle = "-";
          } else if (rank % 10 == 1) {
            rankTitle = String(rank) + "st";
          } else if (rank % 10 == 2) {
            rankTitle = String(rank) + "nd";
          } else if (rank % 10 == 3) {
            rankTitle = String(rank) + "rd";
          } else {
            rankTitle = String(rank) + "th";
          }

          return (
            <Col key={a.title} xs={6} sm={3}>
              <h4>{a.title}</h4>
              <h3>{count}</h3>
              <span className="text-muted">{rankTitle}</span>
            </Col>
          );
        })}
        <Col key="longest" xs={6} sm={3}>
          <h4>Longest Streak</h4>
          <h3>{longestStreak} days</h3>
          <span className="text-muted" />
        </Col>
        <Col key="current" xs={6} sm={3}>
          <h4>Current Streak</h4>
          <h3>{currentStreak} days</h3>
          <span className="text-muted">Last Accepted: {lastAcceptedDate}</span>
        </Col>
      </Row>
    );
  }
}

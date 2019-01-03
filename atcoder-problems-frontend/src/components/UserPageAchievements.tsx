import * as React from "react";
import { RankPair } from "../model/RankPair";
import { ApiCall } from "../utils/ApiCall";
import { Row, Col } from "react-bootstrap";
import { RankingKind } from "../model/RankingKind";
import { Submission } from "../model/Submission";
import { some, none, Option } from "ts-option";
import { TimeFormatter } from "../utils/TimeFormatter";
import { PredictedRating } from "../model/PredictedRating";
import { UserInfo } from "../model/UserInfo";

interface UserPageAchievementsState {
  first: Array<RankPair>;
  fast: Array<RankPair>;
  short: Array<RankPair>;
  ratings: Array<PredictedRating>;
  userInfo: Option<UserInfo>;
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
    this.state = { first: [], fast: [], short: [], ratings: [], userInfo: none };
  }

  componentWillMount() {
    ApiCall.getRanking(RankingKind.Shortest).then(ranking =>
      this.setState({ short: ranking })
    );
    ApiCall.getRanking(RankingKind.First).then(ranking =>
      this.setState({ first: ranking })
    );
    ApiCall.getRanking(RankingKind.Fastest).then(ranking =>
      this.setState({ fast: ranking })
    );
    ApiCall.getPredictedRatings().then(ratings =>
      this.setState({ ratings: ratings.filter(rating => rating.user_id === this.props.userId) }));
    ApiCall.getUserInfo(this.props.userId).then(info => this.setState({ userInfo: some(info) }))
  }

  render() {
    let achievement: Array<Achievement> = [
      {
        title: "Accepted", ranking: this.state.userInfo.match({
          some: info => [{
            rank: info.accepted_count_rank + 1,
            user_id: info.user_id,
            count: info.accepted_count
          }],
          none: () => []
        })
      },
      { title: "Shortest Codes", ranking: this.state.short },
      { title: "Fastest Codes", ranking: this.state.fast },
      { title: "First Acceptances", ranking: this.state.first },
      {
        title: "Rated Point Sum", ranking: this.state.userInfo.match({
          some: info => [{
            rank: info.rated_point_sum_rank + 1,
            user_id: info.user_id,
            count: info.rated_point_sum
          }],
          none: () => []
        })
      }
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

    let rating = this.state.ratings.length > 0 ? this.state.ratings[0].rating.toFixed(2) : "-";

    return (
      <Row className="placeholders">
        {achievement.map(a => {
          var rank = 0;
          var count = 0;
          a.ranking.forEach(r => {
            if (r.user_id === this.props.userId) {
              rank = r.rank;
              count = r.count;
            }
          });

          var rankTitle = "-";
          if (rank == 0) {
            rankTitle = "-";
          } else if (rank % 10 == 1 && rank % 100 != 11) {
            rankTitle = String(rank) + "st";
          } else if (rank % 10 == 2 && rank % 100 != 12) {
            rankTitle = String(rank) + "nd";
          } else if (rank % 10 == 3 && rank % 100 != 13) {
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
        <Col key="rating" xs={6} sm={3}>
          <h4>Predicted Rating</h4>
          <h3>{rating}</h3>
          <span className="text-muted"></span>
        </Col>
      </Row>
    );
  }
}

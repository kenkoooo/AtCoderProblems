import * as React from "react";
import { RankPair } from "../model/RankPair";
import { ApiCall } from "../utils/ApiCall";
import { Row, Col } from "react-bootstrap";
import { RankingKind } from "../model/RankingKind";

interface UserPageAchievementsState {
  ac: Array<RankPair>;
  first: Array<RankPair>;
  fast: Array<RankPair>;
  short: Array<RankPair>;
}

export interface UserPageAchievementsProps {
  userId: string;
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
    this.state = { ac: [], first: [], fast: [], short: [] };
  }

  componentWillMount() {
    ApiCall.getRanking(RankingKind.Accepted).then(ranking =>
      this.setState({ ac: ranking.slice(0, 1000) })
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
  }

  render() {
    let achievement: Array<Achievement> = [
      { title: "Accepted", ranking: this.state.ac },
      { title: "Shortest Codes", ranking: this.state.short },
      { title: "Fastest Codes", ranking: this.state.fast },
      { title: "First Acceptances", ranking: this.state.first }
    ];

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
      </Row>
    );
  }
}

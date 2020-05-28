import React from "react";
import {
  Row,
  DropdownItem,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
} from "reactstrap";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Tooltip,
} from "recharts";
import { List } from "immutable";
import { InternalRankEntry } from "./Ranking";

interface RankingChartProps {
  data: InternalRankEntry[];
}

interface DisplayEntry {
  rank: number;
  count: number;
  usernames: List<string>;
}

const InternalRankingTooltip = ({
  rank,
  count,
  usernames,
}: DisplayEntry): React.ReactElement => {
  const MAX_DISPLAYED_USERNAMES = 20;

  return (
    <div
      style={{
        margin: "0px",
        padding: "10px",
        backgroundColor: "#ffffff",
        border: "1px solid #cccccc",
        maxWidth: "250px",
        whiteSpace: "pre-wrap",
      }}
    >
      <p style={{ margin: "0" }}>Rank #{rank}</p>
      <p style={{ margin: "0", paddingTop: "4px", color: "#8884d8" }}>
        Username:{" "}
        {usernames.count() <= MAX_DISPLAYED_USERNAMES
          ? usernames.join(", ")
          : usernames.slice(0, MAX_DISPLAYED_USERNAMES).join(", ") + "..."}
      </p>
      <p style={{ margin: "0", color: "#8884d8" }}>Count: {count}</p>
    </div>
  );
};

export const RankingChart = (props: RankingChartProps): React.ReactElement => {
  const [currentDisplayCount, setDisplayCount] = React.useState(100);
  const displayCountOptions = [20, 50, 100, 200, 500, 1000];

  const countByRank = List(props.data)
    .groupBy((entry) => entry.rank)
    .map((list) => list.get(0)!.count)
    .toMap();
  const usernamesByRank = List(props.data)
    .groupBy((entry) => entry.rank)
    .map((list) => list.map((entry) => entry.id).toList())
    .toMap();

  // Generate displayed entries for x-axis to be unique.
  const displayedEntries = List(props.data.slice(0, currentDisplayCount))
    .map((entry) => entry.rank)
    .toOrderedSet()
    .toList()
    .map(
      (rank) =>
        ({
          rank,
          count: countByRank.get(rank, 0),
          usernames: usernamesByRank.get(rank, List<string>()),
        } as DisplayEntry)
    )
    .toArray();

  const RankingTooltip = ({
    active,
    payload,
  }: any): React.ReactElement | null => {
    if (!active) {
      return null;
    }

    const entry: InternalRankEntry = payload?.[0]?.payload;
    if (typeof entry === "undefined") {
      return null;
    }

    return (
      <InternalRankingTooltip
        rank={entry.rank}
        count={entry.count}
        usernames={usernamesByRank.get(entry.rank, List<string>())}
      />
    );
  };

  return (
    <>
      <Row className="mb-3">
        <UncontrolledDropdown>
          <DropdownToggle caret>{currentDisplayCount}</DropdownToggle>
          <DropdownMenu>
            {displayCountOptions.map(
              (count: number): React.ReactElement => (
                <DropdownItem
                  key={count}
                  onClick={(): void => setDisplayCount(count)}
                >
                  {count}
                </DropdownItem>
              )
            )}
          </DropdownMenu>
        </UncontrolledDropdown>
      </Row>

      <Row>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={displayedEntries}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="rank"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(rank: number): string => rank.toFixed()}
            />
            <YAxis />
            <Tooltip content={<RankingTooltip />} />
            <Line isAnimationActive={false} dataKey="count" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </Row>
    </>
  );
};

export default RankingChart;

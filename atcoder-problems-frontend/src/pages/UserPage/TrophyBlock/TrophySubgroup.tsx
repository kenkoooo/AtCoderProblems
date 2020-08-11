import React, { useState } from "react";
import { Table, Badge } from "reactstrap";
import Octicon, {
  Verified,
  TriangleDown,
  TriangleRight,
} from "@primer/octicons-react";
import { Trophy } from "./Trophy";

interface Props {
  achievedIds: Set<string>;
  title: string;
  trophies: Trophy[];
}

export const TrophySubgroup = (props: Props) => {
  const { achievedIds, title, trophies } = props;
  const [showTrophies, setShowTrophies] = useState(false);

  const achievedTrophies = trophies.filter((t) => t.achieved);
  const displayedTrophies = trophies.filter(
    (t) =>
      t.achieved ||
      t.dependsOn.every((dependency) => achievedIds.has(dependency))
  );

  return (
    <>
      <h5
        onClick={() => setShowTrophies(!showTrophies)}
        style={{ cursor: "pointer" }}
      >
        <Octicon
          size="small"
          icon={showTrophies ? TriangleDown : TriangleRight}
          verticalAlign="middle"
        />{" "}
        <Badge
          pill
          color={
            achievedTrophies.length === trophies.length ? "success" : "primary"
          }
        >
          {achievedTrophies.length}
        </Badge>{" "}
        {title}
      </h5>

      {showTrophies ? (
        <Table striped hover>
          <tbody>
            {displayedTrophies.map(({ sortId, title, reason, achieved }) => (
              <tr key={sortId}>
                <th className="text-success">
                  {achieved && <Octicon icon={Verified} />}
                </th>
                <td>
                  <b>{achieved ? title : "???"}</b>
                </td>
                <td>{reason}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : null}
    </>
  );
};

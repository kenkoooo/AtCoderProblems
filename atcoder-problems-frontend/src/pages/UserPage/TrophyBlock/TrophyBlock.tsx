import Octicon, { Verified } from "@primer/octicons-react";
import React from "react";
import { Table, Row } from "reactstrap";
import Submission from "../../../interfaces/Submission";
import { generateACCountTrophies } from "./ACCountTrophyGenerator";
import { generateStreakTrophies } from "./StreakTrophyGenerator";
import { Trophy } from "./Trophy";

interface Props {
  submissions: Submission[];
}

export const TrophyBlock = (props: Props): JSX.Element => {
  const { submissions } = props;
  const trophies = [] as Trophy[];
  trophies.push(...generateStreakTrophies(submissions));
  trophies.push(...generateACCountTrophies(submissions));

  const filteredTrophies = trophies
    .sort((a, b) => a.sortId.localeCompare(b.sortId))
    .filter((t) => t.achieved);
  return (
    <>
      <Row className="my-2">
        <h2>{filteredTrophies.length} Trophies</h2>
      </Row>
      <Row>
        <Table striped hover>
          <tbody>
            {filteredTrophies.map(({ sortId, title, reason }) => (
              <tr key={sortId}>
                <th className="text-success">
                  <Octicon icon={Verified} />
                </th>
                <td>
                  <b>{title}</b>
                </td>
                <td>{reason}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Row>
    </>
  );
};

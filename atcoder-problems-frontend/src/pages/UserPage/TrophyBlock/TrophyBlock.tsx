import Octicon, { Verified } from "@primer/octicons-react";
import React from "react";
import { Table, Row } from "reactstrap";
import Submission from "../../../interfaces/Submission";
import { generateLanguageTrophies } from "./StreakTrophyGenerator";

interface Props {
  submissions: Submission[];
}

export const TrophyBlock = (props: Props): JSX.Element => {
  const { submissions } = props;
  const streakTrophies = generateLanguageTrophies(submissions).filter(
    (t) => t.achieved
  );
  streakTrophies.sort((a, b) => a.sortId.localeCompare(b.sortId));
  return (
    <>
      <Row className="my-2">
        <h2>{streakTrophies.length} Trophies</h2>
      </Row>
      <Row>
        <Table striped hover>
          <tbody>
            {streakTrophies.map(({ sortId, title, reason }) => (
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

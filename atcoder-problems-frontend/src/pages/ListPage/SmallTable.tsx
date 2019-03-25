import React from "react";
import { isAccepted } from "../../utils";
import Table from "reactstrap/lib/Table";
import Row from "reactstrap/lib/Row";

interface Props {
  problems: { point?: number | null; rivals: string[]; status: string }[];
  user_id: string | undefined;
}

const SmallTable = ({ problems, user_id }: Props) => {
  const point_count_map = new Map<number, number>();
  const user_count_map = new Map<string, Map<number, number>>();
  problems.forEach(p => {
    if (p.point) {
      const count = point_count_map.get(p.point);
      if (count) {
        point_count_map.set(p.point, count + 1);
      } else {
        point_count_map.set(p.point, 1);
      }
      if (isAccepted(p.status) && user_id) {
        const map = user_count_map.get(user_id);
        if (map) {
          const count = map.get(p.point);
          if (count) {
            map.set(p.point, count + 1);
          } else {
            map.set(p.point, 1);
          }
        } else {
          const m = new Map<number, number>();
          m.set(p.point, 1);
          user_count_map.set(user_id, m);
        }
      }
    }
  });

  const point_count = Array.from(point_count_map)
    .map(([point, count]) => ({ point, count }))
    .sort((a, b) => a.point - b.point);

  const user_count = Array.from(user_count_map).map(([user_id, map]) => ({
    user_id,
    map
  }));

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>User</th>
          {point_count.map(({ point }) => (
            <th key={point}>{point}</th>
          ))}
        </tr>
        <tr>
          <th>Sum</th>
          {point_count.map(({ point, count }) => (
            <th key={point}>{count}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {user_count.map(({ map, user_id }) => (
          <tr key={user_id}>
            <td>{user_id}</td>
            {point_count.map(({ point }) => {
              const count = map.get(point);
              if (count != undefined) {
                return <td>{count}</td>;
              } else {
                return <td>0</td>;
              }
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default SmallTable;

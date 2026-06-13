import React from "react";
import { formatMomentDate, parseSecond } from "../../../utils/DateUtil";

interface DailyEffortTooltipPayload {
  value: number;
  dataKey: string;
  stroke: string;
}
interface DailyEffortTooltipProps {
  active: boolean;
  payload?: DailyEffortTooltipPayload[];
  label: number;
}

export const DailyEffortTooltip: React.FC<DailyEffortTooltipProps> = (
  props
) => {
  const { active, payload, label } = props;
  if (!active || payload === undefined) return null;
  const dateSecond = label;
  return (
    <div
      className="recharts-default-tooltip"
      style={{
        margin: "0px",
        padding: "10px",
        backgroundColor: "rgb(255, 255, 255)",
        border: "1px solid rgb(204, 204, 204)",
        whiteSpace: "nowrap",
      }}
    >
      <p className="recharts-tooltip-label" style={{ margin: "0px" }}>
        {formatMomentDate(parseSecond(dateSecond))}
      </p>
      <ul
        className="recharts-tooltip-item-list"
        style={{ padding: "0px", margin: "0px" }}
      >
        <li
          className="recharts-tooltip-item"
          style={{
            display: "block",
            paddingTop: "4px",
            paddingBottom: "4px",
            color: "rgb(136, 132, 216)",
          }}
        >
          <span className="recharts-tooltip-item-name">count</span>
          <span className="recharts-tooltip-item-separator"> : </span>
          <span className="recharts-tooltip-item-value">
            {payload.reduce(
              (acc: number, entry: DailyEffortTooltipPayload) =>
                acc + entry.value,
              0
            )}
          </span>
          <span className="recharts-tooltip-item-unit" />
        </li>
      </ul>
      <hr style={{ marginTop: "0.3em", marginBottom: "0.3em" }} />
      <table>
        <tbody>
          {payload.reverse().map((entry: DailyEffortTooltipPayload) => {
            if (entry.value <= 0) return null;
            return (
              <tr style={{ color: entry.stroke }} key={entry.dataKey}>
                <td align="right">
                  {entry.dataKey === "Black" ? "Other" : entry.dataKey}
                </td>
                <td>{" : "}</td>
                <td align="right">{entry.value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

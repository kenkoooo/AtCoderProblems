import { Link } from "react-router-dom";
import * as DateUtil from "../../utils/DateUtil";
import React from "react";
import { formatMode, VirtualContestInfo, VirtualContestMode } from "./types";
import { Timer } from "../../components/Timer";
import { ReactBootstrapTable } from "../../components/ReactBootstrapTable";

const formatContestDuration = (
  start: number,
  durationSecond: number
): string | React.ReactElement => {
  const now = Math.floor(Date.now() / 1000);
  if (start + durationSecond <= now || now < start) {
    const durationMinute = Math.floor(durationSecond / 60);
    const hour = `${Math.floor(durationMinute / 60)}`;
    const minute = `0${durationMinute % 60}`.slice(-2);
    return hour + ":" + minute;
  } else {
    const remain = durationSecond - (now - start);
    return <Timer remain={remain} />;
  }
};

interface Props {
  contests: VirtualContestInfo[];
}

export const VirtualContestTable: React.FC<Props> = (props) => {
  return (
    <ReactBootstrapTable
      striped
      hover
      data={props.contests}
      keyField="id"
      sizePerPage={10}
      useSearch
      usePagination
      columns={[
        {
          dataField: "title",
          headerAlign: "left",
          formatter: function Formatter(
            title: string,
            contest: VirtualContestInfo
          ): React.ReactElement {
            return <Link to={`/contest/show/${contest.id}`}>{title}</Link>;
          },
          text: "Title",
        },
        {
          dataField: "memo",
          headerAlign: "left",
          text: "Description",
        },
        {
          dataField: "mode",
          headerAlign: "left",
          text: "Mode",
          formatter: (mode: VirtualContestMode): string => {
            return formatMode(mode);
          },
        },
        {
          dataField: "start_epoch_second",
          headerAlign: "left",
          formatter: (_: number, contest: VirtualContestInfo): string => {
            const time = DateUtil.parseSecond(contest.start_epoch_second);
            return DateUtil.formatMomentDateTimeDay(time);
          },
          text: "Start",
        },
        {
          dataField: "end_epoch_second",
          headerAlign: "left",
          formatter: (_: number, contest: VirtualContestInfo): string => {
            const time = DateUtil.parseSecond(
              contest.start_epoch_second + contest.duration_second
            );
            return DateUtil.formatMomentDateTimeDay(time);
          },
          text: "End",
        },
        {
          dataField: "duration",
          headerAlign: "left",
          formatter: (
            _: number,
            contest: VirtualContestInfo
          ): string | React.ReactElement => {
            return formatContestDuration(
              contest.start_epoch_second,
              contest.duration_second
            );
          },
          text: "Duration",
        },
      ]}
    />
  );
};

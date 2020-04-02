import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Link } from "react-router-dom";
import * as DateUtil from "../../utils/DateUtil";
import React from "react";
import { VirtualContestInfo } from "./types";
import Timer from "../../components/Timer";

export default (props: { contests: VirtualContestInfo[] }) => {
  return (
    <BootstrapTable
      data={props.contests}
      pagination
      keyField="id"
      height="auto"
      hover
      striped
      search
    >
      <TableHeaderColumn
        dataField="title"
        dataFormat={(title: string, contest: VirtualContestInfo) => (
          <Link to={`/contest/show/${contest.id}`}>{title}</Link>
        )}
      >
        Title
      </TableHeaderColumn>
      <TableHeaderColumn dataField="memo">Description</TableHeaderColumn>
      <TableHeaderColumn
        dataField="start_epoch_second"
        dataFormat={(_: number, contest: VirtualContestInfo) => {
          const time = DateUtil.parseSecond(contest.start_epoch_second);
          return DateUtil.formatMomentDateTimeDay(time);
        }}
      >
        Start
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="end_epoch_second"
        dataFormat={(_: number, contest: VirtualContestInfo) => {
          const time = DateUtil.parseSecond(
            contest.start_epoch_second + contest.duration_second
          );
          return DateUtil.formatMomentDateTimeDay(time);
        }}
      >
        End
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="duration"
        dataFormat={(_: number, contest: VirtualContestInfo) => {
          return formatContestDuration(
            contest.start_epoch_second,
            contest.duration_second
          );
        }}
      >
        Duration
      </TableHeaderColumn>
    </BootstrapTable>
  );
};

const formatContestDuration = (start: number, durationSecond: number) => {
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

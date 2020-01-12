import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Link } from "react-router-dom";
import * as DateUtil from "../../utils/DateUtil";
import React from "react";
import { VirtualContest } from "./types";

export default (props: { contests: VirtualContest[] }) => {
  return (
    <BootstrapTable
      data={props.contests.sort(
        (a, b) => b.start_epoch_second - a.start_epoch_second
      )}
      pagination
      keyField="id"
      height="auto"
      hover
      striped
      search
    >
      <TableHeaderColumn
        dataField="title"
        dataFormat={(title: string, contest: VirtualContest) => (
          <Link to={`/contest/show/${contest.id}`}>{title}</Link>
        )}
      >
        Title
      </TableHeaderColumn>
      <TableHeaderColumn dataField="memo">Description</TableHeaderColumn>
      <TableHeaderColumn
        dataField="start_epoch_second"
        dataFormat={(_: number, contest: VirtualContest) => {
          const time = DateUtil.parseSecond(contest.start_epoch_second);
          return DateUtil.formatMomentDateTime(time);
        }}
      >
        Start
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="end_epoch_second"
        dataFormat={(_: number, contest: VirtualContest) => {
          const time = DateUtil.parseSecond(
            contest.start_epoch_second + contest.duration_second
          );
          return DateUtil.formatMomentDateTime(time);
        }}
      >
        End
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="duration"
        dataFormat={(_: number, contest: VirtualContest) => {
          const durationMinute = Math.floor(contest.duration_second / 60);
          const hour = `0${Math.floor(durationMinute / 60)}`.slice(-2);
          const minute = `0${durationMinute % 60}`.slice(-2);
          return hour + ":" + minute;
        }}
      >
        Duration
      </TableHeaderColumn>
    </BootstrapTable>
  );
};

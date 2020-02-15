import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Link } from "react-router-dom";
import * as DateUtil from "../../utils/DateUtil";
import React from "react";
import { VirtualContestInfo } from "./types";

export default (props: { contests: VirtualContestInfo[] }) => {
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
          return DateUtil.formatMomentDateTime(time);
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
          return DateUtil.formatMomentDateTime(time);
        }}
      >
        End
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="duration"
        dataFormat={(_: number, contest: VirtualContestInfo) => {
          const durationMinute = Math.floor(contest.duration_second / 60);
          const hour = Math.floor(durationMinute / 60);
          const minute = durationMinute % 60;
          const hour00 = hour < 10 ? `0${hour}`.slice(-2) : `${hour}`;
          const minute00 = minute < 10 ? `0${minute}`.slice(-2) : `${minute}`;
          return hour00 + ":" + minute00;
        }}
      >
        Duration
      </TableHeaderColumn>
    </BootstrapTable>
  );
};

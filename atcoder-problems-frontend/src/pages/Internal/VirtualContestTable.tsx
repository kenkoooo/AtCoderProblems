import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Link } from "react-router-dom";
import * as DateUtil from "../../utils/DateUtil";
import React from "react";
import { formatMode, VirtualContestInfo, VirtualContestMode } from "./types";
import { Timer } from "../../components/Timer";

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

export const VirtualContestTable: React.FC<Props> = props => {
  return (
    <BootstrapTable
      data={props.contests}
      pagination
      keyField="id"
      height="auto"
      hover
      striped
      options={{
        paginationPosition: "top",
        sizePerPage: 10,
        sizePerPageList: [
          {
            text: "10",
            value: 10
          },
          {
            text: "20",
            value: 20
          },
          {
            text: "50",
            value: 50
          },
          {
            text: "200",
            value: 200
          },
          {
            text: "All",
            value: props.contests.length
          }
        ]
      }}
    >
      <TableHeaderColumn
        dataField="title"
        dataFormat={(
          title: string,
          contest: VirtualContestInfo
        ): React.ReactElement => (
          <Link to={`/contest/show/${contest.id}`}>{title}</Link>
        )}
      >
        Title
      </TableHeaderColumn>
      <TableHeaderColumn dataField="memo">Description</TableHeaderColumn>
      <TableHeaderColumn
        dataField="mode"
        dataFormat={(mode: VirtualContestMode): string => {
          return formatMode(mode);
        }}
      >
        Start
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="start_epoch_second"
        dataFormat={(_: number, contest: VirtualContestInfo): string => {
          const time = DateUtil.parseSecond(contest.start_epoch_second);
          return DateUtil.formatMomentDateTimeDay(time);
        }}
      >
        Start
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="end_epoch_second"
        dataFormat={(_: number, contest: VirtualContestInfo): string => {
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
        dataFormat={(
          _: number,
          contest: VirtualContestInfo
        ): string | React.ReactElement => {
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

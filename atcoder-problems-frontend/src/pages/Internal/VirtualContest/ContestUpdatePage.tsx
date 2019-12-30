import React from "react";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import ContestConfig from "./ContestConfig";
import { Redirect, useParams } from "react-router-dom";
import { Alert, Spinner } from "reactstrap";
import * as DateUtil from "../../../utils/DateUtil";
import { CONTEST_ITEM_UPDATE, CONTEST_UPDATE, contestGetUrl } from "../ApiUrl";
import { VirtualContest, VirtualContestItem } from "../types";

interface Request {
  id: string;
  title: string;
  memo: string;
  start_epoch_second: number;
  duration_second: number;
  mode: string | null;
}

interface OuterProps {
  contestId: string;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<VirtualContest | null>;
  updateResponse: PromiseState<{} | null>;
  updateContest: (request: Request, problems: VirtualContestItem[]) => void;
}

const InnerComponent = connect<OuterProps, InnerProps>(props => ({
  contestInfoFetch: {
    url: contestGetUrl(props.contestId)
  },
  updateContest: (request: Request, problems: VirtualContestItem[]) => ({
    updateResponse: {
      url: CONTEST_UPDATE,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      then: () => ({
        url: CONTEST_ITEM_UPDATE,
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contest_id: props.contestId,
          problems: problems.map((p, i) => ({
            ...p,
            order: i
          }))
        })
      })
    }
  }),
  updateResponse: {
    value: null
  }
}))((props: InnerProps) => {
  const { contestId, contestInfoFetch, updateResponse } = props;
  if (contestInfoFetch.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (contestInfoFetch.rejected || !contestInfoFetch.value) {
    return <Alert color="danger">Failed to fetch contest info.</Alert>;
  }
  const contestInfo = contestInfoFetch.value;
  if (updateResponse.fulfilled && updateResponse.value !== null) {
    return <Redirect to={`/contest/show/${contestId}`} />;
  }

  const start = DateUtil.parseSecond(contestInfo.start_epoch_second);
  const end = DateUtil.parseSecond(
    contestInfo.start_epoch_second + contestInfo.duration_second
  );

  const problems = contestInfo.problems.sort((a, b) => {
    if (a.order !== null && b.order !== null) {
      return a.order - b.order;
    }
    return a.id.localeCompare(b.id);
  });

  return (
    <ContestConfig
      pageTitle="Update Contest"
      initialTitle={contestInfo.title}
      initialMemo={contestInfo.memo}
      initialStartDate={DateUtil.formatMomentDate(start)}
      initialStartHour={start.hour()}
      initialStartMinute={start.minute()}
      initialEndDate={DateUtil.formatMomentDate(end)}
      initialEndHour={end.hour()}
      initialEndMinute={end.minute()}
      initialProblems={List(problems)}
      initialMode={contestInfo.mode}
      buttonTitle="Update"
      buttonPush={({
        title,
        memo,
        startSecond,
        endSecond,
        problems: ps,
        mode
      }) => {
        props.updateContest(
          {
            id: contestId,
            title,
            memo,
            start_epoch_second: startSecond,
            duration_second: endSecond - startSecond,
            mode
          },
          ps.toArray()
        );
      }}
    />
  );
});

export default () => {
  const { contestId } = useParams();
  if (contestId) {
    return <InnerComponent contestId={contestId} />;
  } else {
    return <Redirect to="/contest/recent" />;
  }
};

import React from "react";
import { Set } from "immutable";
import { connect, PromiseState } from "react-refetch";
import ContestConfig from "./ContestConfig";
import { Redirect, useParams } from "react-router-dom";
import { VirtualContest } from "./types";
import { Alert, Spinner } from "reactstrap";
import * as DateUtil from "../../../utils/DateUtil";

interface Request {
  id: string;
  title: string;
  memo: string;
  start_epoch_second: number;
  duration_second: number;
}

interface OuterProps {
  contestId: string;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<VirtualContest>;
  updateResponse: PromiseState<{} | null>;
  updateContest: (request: Request, problems: string[]) => void;
}

const InnerComponent = connect<OuterProps, InnerProps>(props => ({
  contestInfoFetch: {
    url: `http://localhost/internal-api/contest/get/${props.contestId}`
  },
  updateContest: (request: Request, problems: string[]) => ({
    updateResponse: {
      url: "http://localhost/internal-api/contest/update",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      then: () => ({
        url: "http://localhost/internal-api/contest/item/update",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contest_id: props.contestId,
          problem_ids: problems
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
  } else if (contestInfoFetch.rejected) {
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
      initialEndMinute={start.minute()}
      initialProblems={Set(contestInfo.problems)}
      buttonTitle="Update"
      buttonPush={({ title, memo, startSecond, endSecond, problems }) =>
        props.updateContest(
          {
            id: contestId,
            title,
            memo,
            start_epoch_second: startSecond,
            duration_second: endSecond - startSecond
          },
          problems.toArray()
        )
      }
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

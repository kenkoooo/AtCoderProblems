import React from "react";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { Redirect } from "react-router-dom";
import { Alert, Spinner } from "reactstrap";
import * as DateUtil from "../../../utils/DateUtil";
import { contestGetUrl } from "../ApiUrl";
import { VirtualContestItem, VirtualContestDetails } from "../types";
import {
  updateVirtualContestInfo,
  updateVirtualContestItems,
} from "./ApiClient";
import { ContestConfig } from "./ContestConfig";

interface Request {
  id: string;
  title: string;
  memo: string;
  start_epoch_second: number;
  duration_second: number;
  mode: string | null;
  is_public: boolean;
  penalty_second: number;
}

interface OuterProps {
  contestId: string;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<VirtualContestDetails | null>;
  updateResponse: PromiseState<unknown | null>;
  updateContest: (request: Request, problems: VirtualContestItem[]) => void;
}

const InnerContestUpdatePage = (props: InnerProps) => {
  const { contestId, contestInfoFetch, updateResponse } = props;
  if (contestInfoFetch.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (contestInfoFetch.rejected || !contestInfoFetch.value) {
    return <Alert color="danger">Failed to fetch contest info.</Alert>;
  }
  const {
    info: contestInfo,
    problems: contestProblems,
  } = contestInfoFetch.value;
  if (updateResponse.fulfilled && updateResponse.value !== null) {
    return <Redirect to={`/contest/show/${contestId}`} />;
  }

  const start = DateUtil.parseSecond(contestInfo.start_epoch_second);
  const end = DateUtil.parseSecond(
    contestInfo.start_epoch_second + contestInfo.duration_second
  );

  const problems = contestProblems.sort((a, b) => {
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
      initialPublicState={contestInfo.is_public}
      initialPenaltySecond={contestInfo.penalty_second}
      buttonTitle="Update"
      buttonPush={({
        title,
        memo,
        startSecond,
        endSecond,
        problems: ps,
        mode,
        publicState,
        penaltySecond,
      }): void => {
        props.updateContest(
          {
            id: contestId,
            title,
            memo,
            start_epoch_second: startSecond,
            duration_second: endSecond - startSecond,
            mode,
            is_public: publicState,
            penalty_second: penaltySecond,
          },
          ps.toArray()
        );
      }}
    />
  );
};

export const ContestUpdatePage = connect<OuterProps, InnerProps>((props) => ({
  contestInfoFetch: {
    url: contestGetUrl(props.contestId),
  },
  updateContest: (request: Request, problems: VirtualContestItem[]) => ({
    updateResponse: {
      comparison: null,
      value: () =>
        updateVirtualContestInfo(request).then(() =>
          updateVirtualContestItems(props.contestId, problems)
        ),
    },
  }),
  updateResponse: {
    value: null,
  },
}))(InnerContestUpdatePage);

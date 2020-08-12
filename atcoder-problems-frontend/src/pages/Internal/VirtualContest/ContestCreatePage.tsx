import React from "react";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { Redirect } from "react-router-dom";
import * as DateUtil from "../../../utils/DateUtil";
import { VirtualContestItem } from "../types";
import {
  CreateContestRequest,
  CreateContestResponse,
  createVirtualContest,
  updateVirtualContestItems,
} from "./ApiClient";
import { ContestConfig } from "./ContestConfig";

const InnerContestCreatePage: React.FC<InnerProps> = (props) => {
  const createResponse = props.createContestResponse.fulfilled
    ? props.createContestResponse.value
    : null;
  const updateResponse = props.updateResponse.fulfilled
    ? props.updateResponse.value
    : null;
  if (createResponse !== null && updateResponse !== null) {
    const contestId = createResponse.contest_id;
    return <Redirect to={`/contest/show/${contestId}`} />;
  }

  const todayMoment = DateUtil.getToday();
  const d = 5 - (todayMoment.minutes() % 5);
  const today = todayMoment.add(d, "minute");
  const todayDateTime = DateUtil.formatMomentDate(today);
  const todayHour = today.hour();
  const todayMinute = today.minute();

  return (
    <ContestConfig
      pageTitle="Create Contest"
      initialTitle={props.initialTitle ?? ""}
      initialMemo=""
      initialStartDate={todayDateTime}
      initialStartHour={todayHour}
      initialStartMinute={todayMinute}
      initialEndDate={todayDateTime}
      initialEndHour={todayHour}
      initialEndMinute={todayMinute}
      initialProblems={props.initialProblems ?? List()}
      initialMode={null}
      initialPublicState={true}
      initialPenaltySecond={300}
      buttonTitle="Create Contest"
      buttonPush={({
        title,
        memo,
        startSecond,
        endSecond,
        problems,
        mode,
        publicState,
        penaltySecond,
      }): void =>
        props.createContest(
          {
            title,
            memo,
            start_epoch_second: startSecond,
            duration_second: endSecond - startSecond,
            mode,
            is_public: publicState,
            penalty_second: penaltySecond,
          },
          problems.toArray()
        )
      }
    />
  );
};

interface OuterProps {
  initialTitle?: string;
  initialProblems?: List<VirtualContestItem>;
}

interface InnerProps extends OuterProps {
  createContestResponse: PromiseState<CreateContestResponse | null>;
  createContest: (
    request: CreateContestRequest,
    problems: VirtualContestItem[]
  ) => void;
  updateResponse: PromiseState<{} | null>;
}

export const ContestCreatePage = connect<OuterProps, InnerProps>(() => ({
  createContest: (
    request: CreateContestRequest,
    problems: VirtualContestItem[]
  ) => ({
    createContestResponse: {
      comparison: null,
      value: () => createVirtualContest(request),
      andThen: (response: CreateContestResponse) => ({
        updateResponse: {
          comparison: null,
          value: () => updateVirtualContestItems(response.contest_id, problems),
        },
      }),
    },
  }),
  createContestResponse: {
    value: null,
  },
  updateResponse: {
    value: null,
  },
}))(InnerContestCreatePage);

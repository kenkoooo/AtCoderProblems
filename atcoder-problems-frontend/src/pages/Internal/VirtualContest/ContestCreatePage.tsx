import React from "react";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { Redirect } from "react-router-dom";
import * as DateUtil from "../../../utils/DateUtil";
import { CONTEST_CREATE, CONTEST_ITEM_UPDATE } from "../ApiUrl";
import { VirtualContestItem, VirtualContestMode } from "../types";
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
      initialTitle=""
      initialMemo=""
      initialStartDate={todayDateTime}
      initialStartHour={todayHour}
      initialStartMinute={todayMinute}
      initialEndDate={todayDateTime}
      initialEndHour={todayHour}
      initialEndMinute={todayMinute}
      initialProblems={List()}
      initialMode={null}
      initialPublicState={false}
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

interface Request {
  title: string;
  memo: string;
  start_epoch_second: number;
  duration_second: number;
  mode: VirtualContestMode;
  is_public: boolean;
  penalty_second: number;
}

interface Response {
  contest_id: string;
}

interface InnerProps {
  createContestResponse: PromiseState<Response | null>;
  createContest: (request: Request, problems: VirtualContestItem[]) => void;
  updateResponse: PromiseState<{} | null>;
}

export const ContestCreatePage = connect<{}, InnerProps>(() => ({
  createContest: (request: Request, problems: VirtualContestItem[]) => ({
    createContestResponse: {
      url: CONTEST_CREATE,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      andThen: (response: Response) => ({
        updateResponse: {
          url: CONTEST_ITEM_UPDATE,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contest_id: response.contest_id,
            problems: problems.map((p, i) => ({
              ...p,
              order: i,
            })),
          }),
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

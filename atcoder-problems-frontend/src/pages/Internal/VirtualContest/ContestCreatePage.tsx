import React, { useState } from "react";
import { List } from "immutable";
import { Redirect } from "react-router-dom";
import * as DateUtil from "../../../utils/DateUtil";
import { VirtualContestItem } from "../types";
import {
  CreateContestRequest,
  createVirtualContest,
  updateVirtualContestItems,
} from "./ApiClient";
import { ContestConfig } from "./ContestConfig";

const createAndUpdateContest = async (
  createContestRequest: CreateContestRequest,
  problems: VirtualContestItem[]
) => {
  const response = await createVirtualContest(createContestRequest);
  await updateVirtualContestItems(response.contest_id, problems);
  return response.contest_id;
};

export const ContestCreatePage: React.FC<Props> = (props) => {
  const [createdContestId, setCreatedContestId] = useState<string | null>(null);
  if (createdContestId) {
    return <Redirect to={`/contest/show/${createdContestId}`} />;
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
      buttonPush={async ({
        title,
        memo,
        startSecond,
        endSecond,
        problems,
        mode,
        publicState,
        penaltySecond,
      }) => {
        const contestId = await createAndUpdateContest(
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
        );
        setCreatedContestId(contestId);
      }}
    />
  );
};

interface Props {
  initialTitle?: string;
  initialProblems?: List<VirtualContestItem>;
}

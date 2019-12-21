import React from "react";
import { Set } from "immutable";
import { connect, PromiseState } from "react-refetch";
import ContestConfig from "./ContestConfig";
import { Redirect } from "react-router-dom";
import * as DateUtil from "../../../utils/DateUtil";
import { CONTEST_CREATE, CONTEST_ITEM_UPDATE } from "../ApiUrl";

const ContestCreatePage = (props: InnerProps) => {
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
      initialProblems={Set()}
      buttonTitle="Create"
      buttonPush={({ title, memo, startSecond, endSecond, problems }) =>
        props.createContest(
          {
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
};

interface Request {
  title: string;
  memo: string;
  start_epoch_second: number;
  duration_second: number;
}

interface Response {
  contest_id: string;
}

interface InnerProps {
  createContestResponse: PromiseState<Response | null>;
  createContest: (request: Request, problems: string[]) => void;
  updateResponse: PromiseState<{} | null>;
}

const mapper = () => {
  return {
    createContest: (request: Request, problems: string[]) => ({
      createContestResponse: {
        url: CONTEST_CREATE,
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request),
        andThen: (response: Response) => ({
          updateResponse: {
            url: CONTEST_ITEM_UPDATE,
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contest_id: response.contest_id,
              problem_ids: problems
            })
          }
        })
      }
    }),
    createContestResponse: {
      value: null
    },
    updateResponse: {
      value: null
    }
  };
};

export default connect<{}, InnerProps>(mapper)(ContestCreatePage);

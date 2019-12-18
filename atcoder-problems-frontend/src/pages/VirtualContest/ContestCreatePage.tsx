import React from "react";
import { Set } from "immutable";
import { connect, PromiseState } from "react-refetch";
import ContestConfig from "./ContestConfig";

const ContestCreatePage = (props: InnerProps) => {
  if (props.createContestResponse.fulfilled) {
    console.log(props.createContestResponse.value);
  }
  return (
    <ContestConfig
      pageTitle="Create Contest"
      initialTitle=""
      initialMemo=""
      initialStartDate=""
      initialStartHour={0}
      initialStartMinute={0}
      initialEndDate=""
      initialEndHour={0}
      initialEndMinute={0}
      initialProblems={Set()}
      buttonTitle="Create"
      buttonPush={({ title, memo, startSecond, endSecond }) =>
        props.createContest({
          title,
          memo,
          start_epoch_second: startSecond,
          duration_second: endSecond - startSecond
        })
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
  createContest: (reqiest: Request) => void;
}

const mapper = () => {
  return {
    createContest: (request: Request) => ({
      createContestResponse: {
        url: "http://localhost/atcoder-api/v3/internal/contest/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request),
        then: (response: Response) => ({
          url: "http://localhost/atcoder-api/v3/internal/contest/update",
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: response.contest_id,
            title: request.title,
            memo: request.memo,
            start_epoch_second: request.start_epoch_second,
            duration_second: request.duration_second
          })
        })
      }
    }),
    createContestResponse: {
      value: null
    }
  };
};

export default connect<{}, InnerProps>(mapper)(ContestCreatePage);

import React from "react";
import { Set } from "immutable";
import { connect, PromiseState } from "react-refetch";
import ContestConfig from "./ContestConfig";
import { Redirect } from "react-router-dom";

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
        url: "http://localhost/internal-api/contest/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request),
        andThen: (response: Response) => ({
          updateResponse: {
            url: "http://localhost/internal-api/contest/item/update",
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

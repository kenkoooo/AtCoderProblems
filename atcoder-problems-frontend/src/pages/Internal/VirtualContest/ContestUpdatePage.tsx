import React from "react";
import { List } from "immutable";
import { Redirect } from "react-router-dom";
import { Alert, Spinner } from "reactstrap";
import { useVirtualContest } from "../../../api/InternalAPIClient";
import * as DateUtil from "../../../utils/DateUtil";
import { VirtualContestItem } from "../types";
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

interface Props {
  contestId: string;
}

const updateContest = async (
  request: Request,
  problems: VirtualContestItem[]
) => {
  const response = await updateVirtualContestInfo(request).then(() =>
    updateVirtualContestItems(request.id, problems)
  );
  return response.status === 200;
};

export const ContestUpdatePage = (props: Props) => {
  const { contestId } = props;
  const contestResponse = useVirtualContest(contestId);
  const [updateResponse, setUpdateResponse] = React.useState<boolean>(false);
  if (!contestResponse.data && !contestResponse.error) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (contestResponse.error || !contestResponse.data) {
    return <Alert color="danger">Failed to fetch contest info.</Alert>;
  }

  const contestInfo = contestResponse.data.info;
  const contestProblems = contestResponse.data.problems;

  if (updateResponse) {
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
      buttonPush={async ({
        title,
        memo,
        startSecond,
        endSecond,
        problems: ps,
        mode,
        publicState,
        penaltySecond,
      }) => {
        const status = await updateContest(
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
        setUpdateResponse(status);
      }}
    />
  );
};

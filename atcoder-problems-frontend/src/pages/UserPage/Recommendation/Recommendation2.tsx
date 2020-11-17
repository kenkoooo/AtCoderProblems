import { List, Map as ImmutableMap } from "immutable";
import React, { useState } from "react";
import {
  Card,
  CardBody,
  Col,
  CustomInput,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Form,
  Row,
  UncontrolledDropdown,
} from "reactstrap";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
} from "../../../interfaces/ProblemModel";
import { RatingInfo } from "../../../utils/RatingInfo";
import Problem from "../../../interfaces/Problem";
import {
  formatPredictedSolveProbability,
  formatPredictedSolveTime,
  predictSolveProbability,
  predictSolveTime,
} from "../../../utils/ProblemModelUtil";
import { isAccepted, shuffleList } from "../../../utils";
import { ProblemLink } from "../../../components/ProblemLink";
import { useTheme } from "../../../components/ThemeProvider";
import { HelpBadgeModal } from "../../../components/HelpBadgeModal";
import { ContestLink } from "../../../components/ContestLink";
import Contest from "../../../interfaces/Contest";
import { NewTabLink } from "../../../components/NewTabLink";
import * as Url from "../../../utils/Url";
import { ProblemId } from "../../../interfaces/Status";
import Submission from "../../../interfaces/Submission";
import {
  ExcludeOption,
  ExcludeOptions,
  formatExcludeOption,
  isIncluded,
} from "./Option";

const logit = (x: number) => Math.log(x / (1 - x));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

const SolveProbabilityInf = 0.03;
const XAtSup = logit(SolveProbabilityInf);
const SolveProbabilityThresholds = [
  sigmoid(-XAtSup / 5),
  sigmoid(XAtSup / 5),
  sigmoid((XAtSup * 3) / 5),
  SolveProbabilityInf,
] as const;

const NumProblemsToShow = 6;

interface Props {
  readonly problems: List<Problem>;
  readonly contests: ImmutableMap<string, Contest>;
  readonly problemModels: ImmutableMap<string, ProblemModel>;
  readonly userRatingInfo: RatingInfo;
  readonly userSubmissions: Submission[];
}

export const Recommendation2: React.FC<Props> = (props) => {
  const {
    problems,
    contests,
    problemModels,
    userRatingInfo,
    userSubmissions,
  } = props;

  const [includeExperimental, setIncludeExperimental] = useState(true);
  const [excludeOption, setExcludeOption] = useState<ExcludeOption>("Exclude");

  const theme = useTheme();

  const lastSolvedTimeMap = new Map<ProblemId, number>();
  userSubmissions
    .filter((s) => isAccepted(s.result))
    .forEach((s) => {
      const cur = lastSolvedTimeMap.get(s.problem_id) ?? 0;
      lastSolvedTimeMap.set(s.problem_id, Math.max(s.epoch_second, cur));
    });
  const currentSecond = Math.floor(new Date().getTime() / 1000);

  const problemCandidates = problems
    .filter((p) =>
      isIncluded(p.id, excludeOption, currentSecond, lastSolvedTimeMap)
    )
    .filter((p) => problemModels.has(p.id))
    .map((p) => ({
      ...p,
      difficulty: problemModels.get(p.id)?.difficulty,
      is_experimental: problemModels.get(p.id)?.is_experimental ?? false,
    }))
    .filter((p) => includeExperimental || !p.is_experimental)
    .filter((p) => p.difficulty !== undefined)
    .map((p) => {
      const internalRating = userRatingInfo.internalRating;
      let predictedSolveProbability = -1;
      let predictedSolveTime: number | null = null;
      if (internalRating !== null) {
        const problemModel: ProblemModel = problemModels.get(p.id, {
          slope: undefined,
          difficulty: undefined,
          rawDifficulty: undefined,
          intercept: undefined,
          discrimination: undefined,
          is_experimental: false,
          variance: undefined,
        });
        if (isProblemModelWithDifficultyModel(problemModel)) {
          predictedSolveProbability = predictSolveProbability(
            problemModel,
            internalRating
          );
        }
        if (isProblemModelWithTimeModel(problemModel)) {
          predictedSolveTime = predictSolveTime(problemModel, internalRating);
        }
      }
      return { ...p, predictedSolveProbability, predictedSolveTime };
    })
    .filter(
      (p) =>
        SolveProbabilityThresholds[0] >= p.predictedSolveProbability &&
        p.predictedSolveProbability > SolveProbabilityThresholds[3]
    );
  const classifiedProblemsOfId = (id: number) => {
    const list = problemCandidates.filter(
      (p) =>
        SolveProbabilityThresholds[id] >= p.predictedSolveProbability &&
        p.predictedSolveProbability > SolveProbabilityThresholds[id + 1]
    );
    return shuffleList(list).slice(0, NumProblemsToShow).toArray();
  };

  const recommendationDataList = [
    {
      name: "Moderate",
      color: theme.difficultyBlueColor,
      problems: classifiedProblemsOfId(0),
    },
    {
      name: "Difficult",
      color: theme.difficultyYellowColor,
      problems: classifiedProblemsOfId(1),
    },
    {
      name: "Challenge",
      color: theme.difficultyOrangeColor,
      problems: classifiedProblemsOfId(2),
    },
  ];

  return (
    <>
      <Row className="my-2">
        <Col>
          <Form inline>
            <CustomInput
              type="switch"
              id="IncludeExperimentalSwitch"
              label="Include 🧪"
              inline
              checked={includeExperimental}
              onClick={() => setIncludeExperimental(!includeExperimental)}
            />
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {formatExcludeOption(excludeOption)}
              </DropdownToggle>
              <DropdownMenu>
                {ExcludeOptions.map((option) => (
                  <DropdownItem
                    key={option}
                    onClick={(): void => setExcludeOption(option)}
                  >
                    {formatExcludeOption(option)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledDropdown>
          </Form>
        </Col>
      </Row>
      {recommendationDataList.map((d) => (
        <Row key={d.name} className="my-2">
          <Col>
            <h2 style={{ color: d.color }} className="text-center">
              {d.name}
            </h2>
            <Row className="justify-content-center">
              {d.problems.length === 0 ? (
                <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                  No problems!
                </span>
              ) : (
                d.problems.map((p) => {
                  const contest = contests.get(p.contest_id);
                  return (
                    <Col
                      key={p.id}
                      className="text-center my-1"
                      md="4"
                      sm="6"
                      xs="12"
                    >
                      <Card>
                        <CardBody>
                          <ProblemLink
                            problemId={p.id}
                            contestId={p.contest_id}
                            problemTitle={p.title}
                          />
                          &nbsp;
                          <HelpBadgeModal
                            id={`ProblemBadge-${p.id}`}
                            title={p.title}
                          >
                            <div className="text-center">
                              <ProblemLink
                                problemId={p.id}
                                contestId={p.contest_id}
                                problemTitle={p.title}
                                problemModel={problemModels.get(p.id, null)}
                                userRatingInfo={userRatingInfo}
                                isExperimentalDifficulty={p.is_experimental}
                                showDifficulty
                                showDifficultyUnavailable
                              />
                              <br />
                              {contest ? (
                                <ContestLink contest={contest} />
                              ) : (
                                <NewTabLink
                                  href={Url.formatContestUrl(p.contest_id)}
                                >
                                  {p.contest_id}
                                </NewTabLink>
                              )}
                              <br />
                              Difficulty: {p.difficulty}
                              <br />
                              Predicted Solve Probability:{" "}
                              {formatPredictedSolveProbability(
                                p.predictedSolveProbability
                              )}
                              <br />
                              Predicted Solve Time:{" "}
                              {formatPredictedSolveTime(p.predictedSolveTime)}
                              <br />
                            </div>
                          </HelpBadgeModal>
                        </CardBody>
                      </Card>
                    </Col>
                  );
                })
              )}
            </Row>
          </Col>
        </Row>
      ))}
    </>
  );
};

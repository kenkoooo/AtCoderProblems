import { List, Map } from "immutable";
import {
  Button,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Form,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Label,
  UncontrolledDropdown,
} from "reactstrap";
import React, { useState } from "react";
import Problem from "../interfaces/Problem";
import { isAccepted, shuffleList } from "../utils";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
} from "../interfaces/ProblemModel";
import { cachedSubmissions } from "../utils/CachedApiClient";

interface Props {
  problems: List<Problem>;
  problemModels: Map<string, ProblemModel>;
  selectProblem: (...problems: Problem[]) => void;
  expectedParticipantUserIds: string[];
  addButtonDisabled: boolean;
  feedbackForDisabledAddButton: string;
}

interface ProblemSelectionParams {
  minDifficulty: number;
  maxDifficulty: number;
}

interface ProblemSetSelectionPreset {
  displayName: string;
  problemSelectionParams: ProblemSelectionParams[];
}

const ABC_PRESET: ProblemSetSelectionPreset = {
  displayName: "Level 1",
  problemSelectionParams: [
    { minDifficulty: 0, maxDifficulty: 50 },
    { minDifficulty: 10, maxDifficulty: 100 },
    { minDifficulty: 50, maxDifficulty: 800 },
    { minDifficulty: 800, maxDifficulty: 1200 },
    { minDifficulty: 1200, maxDifficulty: 1600 },
    { minDifficulty: 2000, maxDifficulty: 2400 },
  ],
};

const ARC_PRESET: ProblemSetSelectionPreset = {
  displayName: "Level 2",
  problemSelectionParams: [
    { minDifficulty: 800, maxDifficulty: 1200 },
    { minDifficulty: 1200, maxDifficulty: 1800 },
    { minDifficulty: 2000, maxDifficulty: 2800 },
    { minDifficulty: 2800, maxDifficulty: 4000 },
  ],
};

const AGC_PRESET: ProblemSetSelectionPreset = {
  displayName: "Level 3",
  problemSelectionParams: [
    { minDifficulty: 400, maxDifficulty: 1200 },
    { minDifficulty: 1200, maxDifficulty: 2400 },
    { minDifficulty: 1600, maxDifficulty: 3200 },
    { minDifficulty: 2400, maxDifficulty: 9999 },
    { minDifficulty: 2800, maxDifficulty: 9999 },
    { minDifficulty: 2800, maxDifficulty: 9999 },
  ],
};
export const ProblemSetGenerator: React.FC<Props> = (props) => {
  const [problemSelectionParamsList, setProblemSelectionParamsList] = useState(
    ABC_PRESET.problemSelectionParams
  );
  const [excludeExperimental, setExcludeExperimental] = useState(false);
  const [
    excludeAlreadySolvedProblems,
    setExcludeAlreadySolvedProblems,
  ] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(ABC_PRESET);

  return (
    <Form className={"w-100"}>
      <FormGroup row>
        <Col>
          <InputGroup>
            <InputGroupAddon addonType="prepend">
              <InputGroupText>
                <Input
                  addon
                  type="checkbox"
                  aria-label="Exclude experimental difficulty"
                  checked={excludeExperimental}
                  onChange={(event): void =>
                    setExcludeExperimental(event.target.checked)
                  }
                />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupText>Exclude experimental difficulty</InputGroupText>
          </InputGroup>
        </Col>
      </FormGroup>
      <FormGroup row>
        <Col>
          <InputGroup>
            <InputGroupAddon addonType="prepend">
              <InputGroupText>
                <Input
                  addon
                  type="checkbox"
                  aria-label="Exclude already solved problems by expected participants"
                  checked={excludeAlreadySolvedProblems}
                  onChange={(event): void =>
                    setExcludeAlreadySolvedProblems(event.target.checked)
                  }
                />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupText>
              Exclude already solved problems by expected participants
            </InputGroupText>
          </InputGroup>
        </Col>
      </FormGroup>
      <FormGroup row>
        <Col sm={6}>
          <Label>Difficulty Adjustment Preset</Label>
          <InputGroup>
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {selectedPreset.displayName}
              </DropdownToggle>
              <DropdownMenu>
                {[ABC_PRESET, ARC_PRESET, AGC_PRESET].map((preset) => {
                  return (
                    <DropdownItem
                      onClick={(): void => {
                        setSelectedPreset(preset);
                        setProblemSelectionParamsList(
                          preset.problemSelectionParams
                        );
                      }}
                      key={preset.displayName}
                    >
                      {preset.displayName}
                    </DropdownItem>
                  );
                })}
              </DropdownMenu>
            </UncontrolledDropdown>
          </InputGroup>
        </Col>
      </FormGroup>

      {problemSelectionParamsList.map((problemSelectionParams, idx) => (
        <FormGroup row key={idx}>
          <Col sm={6}>
            <Label> Problem {idx + 1}</Label>
            <Button
              close
              onClick={(): void => {
                const newParamsList = [...problemSelectionParamsList];
                newParamsList.splice(idx, 1);
                setProblemSelectionParamsList(newParamsList);
              }}
            />
            <InputGroup>
              <InputGroupAddon addonType="prepend">
                <InputGroupText>Min Difficulty</InputGroupText>
              </InputGroupAddon>
              <Input
                placeholder="Min Difficulty"
                min={0}
                max={10000}
                type="number"
                value={problemSelectionParams.minDifficulty}
                step={50}
                onChange={(event): void => {
                  const newParamsList = [...problemSelectionParamsList];
                  newParamsList[idx] = {
                    ...problemSelectionParams,
                    minDifficulty: parseInt(event.target.value, 10),
                  };
                  setProblemSelectionParamsList(newParamsList);
                }}
              />
              <InputGroupAddon addonType="prepend">
                <InputGroupText>Max Difficulty</InputGroupText>
              </InputGroupAddon>
              <Input
                placeholder="Max Difficulty"
                min={0}
                max={10000}
                type="number"
                value={problemSelectionParams.maxDifficulty}
                step={50}
                onChange={(event): void => {
                  const newParamsList = [...problemSelectionParamsList];
                  newParamsList[idx] = {
                    ...problemSelectionParams,
                    maxDifficulty: parseInt(event.target.value, 10),
                  };
                  setProblemSelectionParamsList(newParamsList);
                }}
              />
            </InputGroup>
          </Col>
        </FormGroup>
      ))}
      <div style={{ paddingBottom: 16 }}>
        <Button
          color={"link"}
          onClick={(): void => {
            let addedElement;
            if (problemSelectionParamsList.length === 0) {
              addedElement = {
                minDifficulty: 0,
                maxDifficulty: 10000,
              };
            } else {
              addedElement = {
                ...problemSelectionParamsList[
                  problemSelectionParamsList.length - 1
                ],
              };
            }

            setProblemSelectionParamsList([
              ...problemSelectionParamsList,
              addedElement,
            ]);
          }}
        >
          More problem ...
        </Button>
      </div>

      <FormGroup row>
        <Col sm={12}>
          <Button
            color="success"
            disabled={
              problemSelectionParamsList.length === 0 || props.addButtonDisabled
            }
            onClick={async (): Promise<void> => {
              const nProblems = problemSelectionParamsList.length;

              let candidateProblems = props.problems.map((problem) => ({
                problem,
                model: props.problemModels.get(problem.id),
              }));

              if (excludeExperimental) {
                candidateProblems = candidateProblems.filter((problem) => {
                  return (
                    problem.model !== undefined &&
                    !problem.model.is_experimental
                  );
                });
              }

              if (excludeAlreadySolvedProblems) {
                try {
                  const alreadySolvedProblems = await Promise.all(
                    props.expectedParticipantUserIds.map(cachedSubmissions)
                  ).then((userSubmissions) => {
                    return List(userSubmissions)
                      .flatten(true)
                      .filter((submission) => isAccepted(submission.result))
                      .map((submission) => submission.problem_id)
                      .toSet();
                  });
                  candidateProblems = candidateProblems.filter(
                    (problem) =>
                      !alreadySolvedProblems.contains(problem.problem.id)
                  );
                } catch (e) {
                  alert(
                    "Error happened during fetching submissions. See console."
                  );
                  throw e;
                }
              }

              candidateProblems = shuffleList(candidateProblems).toList();

              const selectedProblems: Problem[] = [];
              const alreadySelectedProblemIds = new Set<string>();
              const selectionFailedProblemNumbers: number[] = [];
              problemSelectionParamsList.forEach(
                (problemSelectionParams, idx) => {
                  let found = false;
                  candidateProblems.forEach((problem) => {
                    if (
                      found ||
                      alreadySelectedProblemIds.has(problem.problem.id)
                    ) {
                      return;
                    }

                    if (
                      isProblemModelWithDifficultyModel(problem.model) &&
                      problem.model.difficulty >=
                        problemSelectionParams.minDifficulty &&
                      problem.model.difficulty <=
                        problemSelectionParams.maxDifficulty
                    ) {
                      alreadySelectedProblemIds.add(problem.problem.id);
                      selectedProblems.push(problem.problem);
                      found = true;
                      return;
                    }
                  });
                  if (!found) {
                    selectionFailedProblemNumbers.push(idx);
                  }
                }
              );

              if (selectedProblems.length < nProblems) {
                alert(
                  `Only ${
                    selectedProblems.length
                  } problems are prepared. (Failed to assign a problem for problem ${selectionFailedProblemNumbers
                    .map((num) => num + 1)
                    .join(",")})`
                );
              }
              props.selectProblem(...selectedProblems);
            }}
          >
            Add
          </Button>
        </Col>
        <Col>
          {props.addButtonDisabled && (
            <span>{props.feedbackForDisabledAddButton}</span>
          )}
        </Col>
      </FormGroup>
    </Form>
  );
};

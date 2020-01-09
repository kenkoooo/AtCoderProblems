import Problem from "../interfaces/Problem";
import {List, Map} from "immutable";
import {Button, Col, Form, FormGroup, Input, InputGroup, InputGroupAddon, InputGroupText, Label} from "reactstrap";
import React, {useState} from "react";
import {isAccepted, shuffleList} from "../utils";
import ProblemModel, {isProblemModelWithDifficultyModel} from "../interfaces/ProblemModel";
import {cachedSubmissions} from "../utils/CachedApiClient";

interface Props {
  problems: List<Problem>;
  problemModels: Map<string, ProblemModel>;
  selectProblem: (...problems: Problem[]) => void;
}

export default (props: Props) => {
  const [nProblems, setNProblems] = useState(1);
  const [difficultyLowerBound, setDifficultyLowerBound] = useState(0);
  const [excludeLowDifficulty, setExcludeLowDifficulty] = useState(false);
  const [difficultyUpperBound, setDifficultyUpperBound] = useState(10000);
  const [excludeHighDifficulty, setExcludeHighDifficulty] = useState(false);
  const [excludeExperimental, setExcludeExperimental] = useState(false);
  const [excludeUserIds, setExcludeUserIds] = useState("");

  return (
    <Form className={"w-100"}>
      <FormGroup row>
        <InputGroup>
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <Input addon type="checkbox" aria-label="Enable filter by difficulty lower bound"
                     checked={excludeLowDifficulty}
                     onChange={event => setExcludeLowDifficulty(event.target.checked)}/>
            </InputGroupText>
            <InputGroupText>
              Difficulty Lower Bound
            </InputGroupText>
          </InputGroupAddon>
          <Input placeholder="difficulty lower bound" min={0} max={10000} type="number" value={difficultyLowerBound} step={100} disabled={!excludeLowDifficulty}
                 onChange={event => setDifficultyLowerBound(parseInt(event.target.value))}
          />
        </InputGroup>
      </FormGroup>

      <FormGroup row>
        <InputGroup>
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <Input addon type="checkbox" aria-label="Enable filter by difficulty upper bound"
                     checked={excludeHighDifficulty}
                     onChange={event => setExcludeHighDifficulty(event.target.checked)}/>
            </InputGroupText>
            <InputGroupText>
              Difficulty Upper Bound
            </InputGroupText>
          </InputGroupAddon>
          <Input placeholder="difficulty upper bound" min={0} max={10000} type="number" value={difficultyUpperBound} step={100} disabled={!excludeHighDifficulty}
                 onChange={event => setDifficultyUpperBound(parseInt(event.target.value))}
          />
        </InputGroup>
      </FormGroup>

      <FormGroup row>
        <InputGroup>
          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <Input addon type="checkbox" aria-label="Exclude experimental difficulty"
                     checked={excludeExperimental}
                     onChange={event => setExcludeExperimental(event.target.checked)}/>
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupText>
            Exclude experimental difficulty
          </InputGroupText>
        </InputGroup>
      </FormGroup>

      <FormGroup row>
        <Label sm={2}>New to</Label>
        <Col sm={10}>
          <Input placeholder="a list of AtCoder ID separated by space" value={excludeUserIds}
                 onChange={event => setExcludeUserIds(event.target.value)}
          />
        </Col>
      </FormGroup>

      <FormGroup row>
        <Label sm={2}>Size</Label>
        <Col sm={10}>
          <Input placeholder="The number of problems" min={1} max={100} type="number" value={nProblems} step={100}
                 onChange={event => setNProblems(parseInt(event.target.value))}/>
        </Col>
      </FormGroup>

      <FormGroup row>
        <Button
          color="success"
          onClick={() => {
            let candidateProblems = props.problems
              .map(problem => ({
                problem,
                model: props.problemModels.get(problem.id)
              }));

            if (excludeExperimental) {
              candidateProblems = candidateProblems
                .filter(problem => {
                  return problem.model !== undefined && !problem.model.is_experimental
                })
            }

            if (excludeLowDifficulty) {
              candidateProblems = candidateProblems
                .filter(problem => {
                  return isProblemModelWithDifficultyModel(problem.model) && problem.model.difficulty >= difficultyLowerBound;
                })
            }

            if (excludeHighDifficulty) {
              candidateProblems = candidateProblems
                .filter(problem => {
                  return isProblemModelWithDifficultyModel(problem.model) && problem.model.difficulty <= difficultyUpperBound;
                })
            }

            const tokenizedUserIds = List.of(...excludeUserIds.split(" "));
            Promise.all(tokenizedUserIds.map(cachedSubmissions))
              .then((userSubmissions) => {
                const solvedProblemIds = List(userSubmissions)
                  .flatten(true)
                  .filter(submission => isAccepted(submission.result))
                  .map(submission => submission.problem_id)
                  .toSet();

                const filteredProblem = candidateProblems
                  .map(problem => problem.problem)
                  .filter(problem => !solvedProblemIds.contains(problem.id));
                if (filteredProblem.size < nProblems) {
                  alert("Only " + filteredProblem.size + " problems matched, while " + nProblems + " problems requested.");
                }
                props.selectProblem(...shuffleList(filteredProblem, nProblems).toArray());
              });
          }}
        >
          Add
        </Button>
      </FormGroup>
    </Form>
  );
};

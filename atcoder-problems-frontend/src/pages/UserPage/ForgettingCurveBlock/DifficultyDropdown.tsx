import React from "react";
import {
  ButtonGroup,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledButtonDropdown,
} from "reactstrap";
import { DifficultyCircle } from "../../../components/DifficultyCircle";

export const INF_POINT = 1e18;

interface DifficultyDropDownProps {
  readonly fromDifficulty: number;
  readonly setFromDifficulty: React.Dispatch<React.SetStateAction<number>>;
  readonly toDifficulty: number;
  readonly setToDifficulty: React.Dispatch<React.SetStateAction<number>>;
}

// this is very similar to ListPage/index.tsx
export const DifficultyDropDown: React.FC<DifficultyDropDownProps> = (
  props
) => {
  const {
    fromDifficulty,
    setFromDifficulty,
    toDifficulty,
    setToDifficulty,
  } = props;

  const Range = (start: number, end: number, step: number): number[] => {
    const array = [];
    for (let i = start; i < end; i += step) {
      array.push(i);
    }
    return array;
  };

  const difficulties = Range(0, 4400, 400).map((from) => ({
    from,
    to: from === 4000 ? INF_POINT : from + 399,
  }));

  return (
    <ButtonGroup className="mr-4">
      <UncontrolledButtonDropdown>
        <DropdownToggle caret>
          {fromDifficulty === -1 ? "Difficulty From" : `${fromDifficulty} - `}
        </DropdownToggle>
        <DropdownMenu>
          {difficulties.map(({ from, to }) => (
            <DropdownItem
              key={from}
              onClick={(e) => {
                e.preventDefault();
                setFromDifficulty(from);
              }}
            >
              <DifficultyCircle
                difficulty={to}
                id={`from-difficulty-dropdown-${to}`}
              />
              {from} -
            </DropdownItem>
          ))}
        </DropdownMenu>
      </UncontrolledButtonDropdown>
      <UncontrolledButtonDropdown>
        <DropdownToggle caret>
          {toDifficulty === INF_POINT ? "Difficulty To" : ` - ${toDifficulty}`}
        </DropdownToggle>
        <DropdownMenu>
          {difficulties.map(({ to }) => (
            <DropdownItem
              key={to}
              onClick={(e) => {
                e.preventDefault();
                setToDifficulty(to);
              }}
            >
              <DifficultyCircle
                difficulty={to}
                id={`from-difficulty-dropdown-${to}`}
              />
              - {to < INF_POINT ? to : "inf"}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </UncontrolledButtonDropdown>
    </ButtonGroup>
  );
};

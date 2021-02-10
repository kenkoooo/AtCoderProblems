import React from "react";
import {
  Button,
  ButtonGroup,
  CustomInput,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
} from "reactstrap";

const RECOMMEND_NUM_OPTIONS = [
  {
    text: "10",
    value: 10,
  },
  {
    text: "20",
    value: 20,
  },
  {
    text: "50",
    value: 50,
  },
  {
    text: "100",
    value: 100,
  },
  {
    text: "All",
    value: Number.POSITIVE_INFINITY,
  },
];
const RecommendOptions = ["Easy", "Moderate", "Difficult"] as const;
export type RecommendOption = typeof RecommendOptions[number];
const ExcludeOptions = [
  "Exclude",
  "Exclude submitted",
  "6 Months",
  "4 Weeks",
  "2 Weeks",
  "1 Week",
  "Don't exclude",
] as const;
export type ExcludeOption = typeof ExcludeOptions[number];

const formatExcludeOption = (excludeOption: ExcludeOption): string => {
  switch (excludeOption) {
    case "1 Week":
      return "Exclude problems solved in last 7 days.";
    case "2 Weeks":
      return "Exclude problems solved in last 2 weeks.";
    case "4 Weeks":
      return "Exclude problems solved in last 4 weeks";
    case "6 Months":
      return "Exclude problems solved in last 6 months";
    case "Exclude":
      return "Exclude all the solved problems";
    case "Don't exclude":
      return "Don't exclude solved problems.";
    case "Exclude submitted":
      return "Exclude all the submitted problems";
  }
};

interface Props {
  recommendOption: RecommendOption;
  onChangeRecommendOption: (option: RecommendOption) => void;

  excludeOption: ExcludeOption;
  onChangeExcludeOption: (option: ExcludeOption) => void;

  showExperimental: boolean;
  onChangeExperimentalVisibility: (showExperimental: boolean) => void;

  showCount: number;
  onChangeShowCount: (count: number) => void;
}

export const RecommendController = (props: Props) => (
  <>
    <div>
      <ButtonGroup className="mr-3">
        {RecommendOptions.map((type) => (
          <Button
            key={type}
            active={props.recommendOption === type}
            onClick={() => props.onChangeRecommendOption(type)}
          >
            {type}
          </Button>
        ))}
      </ButtonGroup>
      <ButtonGroup className="mr-3">
        <UncontrolledDropdown>
          <DropdownToggle caret>
            {formatExcludeOption(props.excludeOption)}
          </DropdownToggle>
          <DropdownMenu>
            {ExcludeOptions.map((option) => (
              <DropdownItem
                key={option}
                onClick={(): void => props.onChangeExcludeOption(option)}
              >
                {formatExcludeOption(option)}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </UncontrolledDropdown>
      </ButtonGroup>
      <CustomInput
        type="switch"
        id="switchRecommendExperimental"
        inline
        label={
          <span role="img" aria-label="experimental">
            🧪
          </span>
        }
        checked={props.showExperimental}
        onChange={() =>
          props.onChangeExperimentalVisibility(!props.showExperimental)
        }
      />
    </div>
    <UncontrolledDropdown direction="left">
      <DropdownToggle caret>
        {props.showCount === Number.POSITIVE_INFINITY ? "All" : props.showCount}
      </DropdownToggle>
      <DropdownMenu>
        {RECOMMEND_NUM_OPTIONS.map(({ text, value }) => (
          <DropdownItem
            key={value}
            onClick={(): void => props.onChangeShowCount(value)}
          >
            {text}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  </>
);

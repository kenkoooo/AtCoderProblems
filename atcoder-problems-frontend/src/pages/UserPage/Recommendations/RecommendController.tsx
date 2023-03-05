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
import {
  ExcludeOptions,
  ExcludeOption,
  formatExcludeOption,
} from "../../../utils/LastSolvedTime";

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

export type ViewStyle = "List" | "Grid";

// Bootstrap Icons Justify
// https://icons.getbootstrap.com/icons/justify/
const IconList = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="bi bi-justify"
    viewBox="0 0 16 16"
  >
    <path
      fillRule="evenodd"
      d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"
    />
  </svg>
);
// Bootstrap Icons Grid
// https://icons.getbootstrap.com/icons/grid/
const IconGrid = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="bi bi-grid"
    viewBox="0 0 16 16"
  >
    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z" />
  </svg>
);

interface Props {
  recommendOption: RecommendOption;
  onChangeRecommendOption: (option: RecommendOption) => void;

  excludeOption: ExcludeOption;
  onChangeExcludeOption: (option: ExcludeOption) => void;

  showExperimental: boolean;
  onChangeExperimentalVisibility: (showExperimental: boolean) => void;

  showCount: number;
  onChangeShowCount: (count: number) => void;

  viewStyle: ViewStyle;
  setViewStyle: (style: ViewStyle) => void;
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
    <div className="d-inline-flex flex-row-reverse">
      <UncontrolledDropdown className="ml-3" direction="down">
        <DropdownToggle caret>
          {props.showCount === Number.POSITIVE_INFINITY
            ? "All"
            : props.showCount}
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
      <ButtonGroup>
        <Button
          active={props.viewStyle === "List"}
          onClick={() => props.setViewStyle("List")}
        >
          <IconList />
        </Button>
        <Button
          active={props.viewStyle === "Grid"}
          onClick={() => props.setViewStyle("Grid")}
        >
          <IconGrid />
        </Button>
      </ButtonGroup>
    </div>
  </>
);

import React, { useContext } from "react";
import { GoCheck } from "react-icons/go";
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { ThemeContext } from "./ThemeProvider";

export const ThemeSelector: React.FC = () => {
  const [themeId, setThemeId] = useContext(ThemeContext);

  const CheckMark = (props: { isVisible: boolean }) => {
    return (
      <GoCheck
        style={{
          marginRight: "3px",
          visibility: props.isVisible ? "visible" : "hidden",
        }}
      />
    );
  };

  return (
    <UncontrolledDropdown nav inNavbar>
      <DropdownToggle nav caret>
        Theme
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem
          tag="a"
          style={{ cursor: "pointer" }}
          onClick={(): void => setThemeId("light")}
        >
          <CheckMark isVisible={themeId == "light"} />
          Light
        </DropdownItem>
        <DropdownItem
          tag="a"
          style={{ cursor: "pointer" }}
          onClick={(): void => setThemeId("dark")}
        >
          <CheckMark isVisible={themeId == "dark"} />
          Dark (Beta)
        </DropdownItem>
        <DropdownItem
          tag="a"
          style={{ cursor: "pointer" }}
          onClick={(): void => setThemeId("purple")}
        >
          <CheckMark isVisible={themeId == "purple"} />
          Purple (Beta)
        </DropdownItem>
        <DropdownItem
          tag="a"
          style={{ cursor: "pointer" }}
          onClick={(): void => setThemeId("auto")}
        >
          <CheckMark isVisible={themeId == "auto"} />
          Auto
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

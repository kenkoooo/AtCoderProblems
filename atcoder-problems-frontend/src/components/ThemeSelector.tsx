import React, { useContext } from "react";
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { ThemeContext } from "./ThemeProvider";

export const ThemeSelector: React.FC = () => {
  const [, setThemeId] = useContext(ThemeContext);

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
          Light
        </DropdownItem>
        <DropdownItem
          tag="a"
          style={{ cursor: "pointer" }}
          onClick={(): void => setThemeId("dark")}
        >
          Dark (Beta)
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

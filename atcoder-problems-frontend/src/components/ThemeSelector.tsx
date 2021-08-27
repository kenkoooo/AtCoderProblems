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
  // function updateColorShame(e: MediaQueryList): void {
  //   if (e.matches) {
  //     setThemeId("dark");
  //   } else {
  //     setThemeId("light");
  //   }
  // }

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
          {themeId == "light" && <GoCheck />} Light
        </DropdownItem>
        <DropdownItem
          tag="a"
          style={{ cursor: "pointer" }}
          onClick={(): void => setThemeId("dark")}
        >
          {themeId == "dark" && <GoCheck />} Dark (Beta)
        </DropdownItem>
        <DropdownItem
          tag="a"
          style={{ cursor: "pointer" }}
          onClick={(): void => setThemeId("purple")}
        >
          {themeId == "purple" && <GoCheck />} Purple (Beta)
        </DropdownItem>
        <DropdownItem
          tag="a"
          style={{ cursor: "pointer" }}
          onClick={(): void => setThemeId("auto")}
        >
          {themeId == "auto" && <GoCheck />} Auto
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

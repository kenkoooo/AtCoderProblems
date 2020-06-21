import React from "react";
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { Helmet } from "react-helmet";
import { useLocalStorage } from "../utils/LocalStorage";

type Theme = "light" | "dark";

export const ThemeSelector: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "light");

  return (
    <>
      <Helmet>
        <html className={`theme-${theme}`} />
      </Helmet>

      <UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
          Theme
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem
            tag="a"
            style={{ cursor: "pointer" }}
            onClick={(): void => setTheme("light")}
          >
            Light
          </DropdownItem>
          <DropdownItem
            tag="a"
            style={{ cursor: "pointer" }}
            onClick={(): void => setTheme("dark")}
          >
            Dark (Beta)
          </DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    </>
  );
};

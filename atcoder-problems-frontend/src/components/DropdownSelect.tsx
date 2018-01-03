import * as React from "react";
import { DropdownButton, MenuItem } from "react-bootstrap";

export interface DropdownSelectProps {
  data: any[];
  defaultTitle?: string;
  titleFormat?: (item: any) => string;
  onSelect?: (item: any) => void;
}
export interface DropdownSelectState {
  active: number;
}

export class DropdownSelect extends React.Component<
  DropdownSelectProps,
  DropdownSelectState
> {
  constructor(props: DropdownSelectProps) {
    super(props);
    this.state = {
      active: -1
    };
  }

  render() {
    if (this.props.data.length == 0) {
      return <DropdownButton id="empty-dropdown" title="empty" />;
    }

    let titleFormat = (item: any) => item;
    if (this.props.titleFormat) {
      titleFormat = this.props.titleFormat;
    }

    let onSelect = (item: any) => {};
    if (this.props.onSelect) {
      onSelect = this.props.onSelect;
    }

    let active = this.state.active;

    let title = "";
    if (active >= 0) {
      title = titleFormat(this.props.data[active]);
    } else if (this.props.defaultTitle) {
      title = this.props.defaultTitle;
    }

    return (
      <DropdownButton
        title={title}
        id="bg-nested-dropdown"
        onSelect={(e: any) => {
          let i: number = e;
          this.setState({ active: i });
          onSelect(this.props.data[i]);
        }}
      >
        {this.props.data.map((item, i) => (
          <MenuItem eventKey={i} active={i == this.state.active}>
            {titleFormat(item)}
          </MenuItem>
        ))}
      </DropdownButton>
    );
  }
}

import React from "react";
import { Badge, Tooltip } from "reactstrap";

interface Props {
  id: string;
}

interface LocalState {
  tooltipOpen: boolean;
}

class HelpBadgeTooltip extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tooltipOpen: false,
    };
  }

  render(): React.ReactNode {
    const { tooltipOpen } = this.state;
    const badgeId = "HelpBadgeTooltip-" + this.props.id;
    return (
      <>
        <Badge color="secondary" pill id={badgeId}>
          ?
        </Badge>
        <Tooltip
          placement="top"
          target={badgeId}
          isOpen={tooltipOpen}
          toggle={(): void => this.setState({ tooltipOpen: !tooltipOpen })}
        >
          {this.props.children}
        </Tooltip>
      </>
    );
  }
}

export default HelpBadgeTooltip;

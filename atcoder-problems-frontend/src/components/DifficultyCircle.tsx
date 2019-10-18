import React from "react";
import { Tooltip } from "reactstrap";

interface Props {
  id: string;
  difficulty: number | null;
}

interface LocalState {
  tooltipOpen: boolean;
}

function getColor(difficulty: number): string {
  if (difficulty < 400) { return "#808080"; }
  // grey
  else if (difficulty < 800) { return "#804000"; }
  // brown
  else if (difficulty < 1200) { return "#008000"; }
  // green
  else if (difficulty < 1600) { return "#00C0C0"; }
  // cyan
  else if (difficulty < 2000) { return "#0000FF"; }
  // blue
  else if (difficulty < 2400) { return "#C0C000"; }
  // yellow
  else if (difficulty < 2800) { return "#FF8000"; }
  // orange
  else if (difficulty < 3200) { return "#FF0000"; }
  // red
  else if (difficulty < 3600) { return "#725a36"; }
  // bronze
  else if (difficulty < 4000) { return "#808080"; }
  // silver
  else { return "#ffd700"; } // gold
}

export class DifficultyCircle extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tooltipOpen: false
    };
  }

  render(): React.ReactNode {
    const { id, difficulty } = this.props;
    if (difficulty === null) {
      return null;
    }
    const { tooltipOpen } = this.state;
    const fillRatio: number =
      difficulty >= 3200 ? 1.0 : (difficulty % 400) / 400;
    const color: string = getColor(difficulty);
    const r: number = parseInt(color.slice(1, 3), 16);
    const g: number = parseInt(color.slice(3, 5), 16);
    const b: number = parseInt(color.slice(5, 7), 16);
    const styleOptions = Object({
      borderColor: color,
      background:
        difficulty < 3200
          ? `linear-gradient(to top, rgba(${r}, ${g}, ${b}, ${1.0}) 0%, rgba(${r}, ${g}, ${b}, ${1.0}) ${fillRatio *
              100}%, rgba(${r}, ${g}, ${b}, ${0.0}) ${fillRatio *
              100}%, rgba(${r}, ${g}, ${b}, ${0.0}) 100%)`
          : difficulty < 3600
          ? `linear-gradient(to right, ${color}, #ffd10c, ${color})`
          : `linear-gradient(to right, ${color}, white, ${color})`
    });
    const title: string = `Difficulty: ${difficulty}`;
    const circleId = "DifficultyCircle-" + id;
    return (
      <>
        <span
          className="difficulty-circle"
          style={styleOptions}
          id={circleId}
        />
        <Tooltip
          placement="top"
          target={circleId}
          isOpen={tooltipOpen}
          toggle={() => this.setState({ tooltipOpen: !tooltipOpen })}
        >
          {title}
        </Tooltip>
      </>
    );
  }
}

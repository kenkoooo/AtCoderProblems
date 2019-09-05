import React from "react";
import {Tooltip} from "reactstrap";

interface Props {
  id: string;
  difficulty: number | null;
}

interface LocalState {
  tooltipOpen: boolean;
}

function getColor (difficulty: number): string {
  if(difficulty < 400) return '#808080'; // grey
  else if(difficulty < 800) return '#804000'; // brown
  else if(difficulty < 1200) return '#008000'; // green
  else if(difficulty < 1600) return '#00C0C0'; // cyan
  else if(difficulty < 2000) return '#0000FF'; // blue
  else if(difficulty < 2400) return '#C0C000'; // yellow
  else if(difficulty < 2800) return '#FF8000'; // orange
  else return '#FF0000'; // red
}

export class DifficultyCircle extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tooltipOpen: false
    };
  }

  render (): React.ReactNode {
    const {id, difficulty} = this.props;
    if(difficulty === null){
      return null;
    }
    const difficultyClipped = Math.round(difficulty >= 400 ? difficulty : 400 / Math.exp(1.0 - difficulty / 400));
    const {tooltipOpen} = this.state
    const fillRatio: number = (difficultyClipped >= 3200 ? 1.0 : (difficultyClipped % 400) / 400);
    const color: string = getColor(difficultyClipped);
    const r: number = parseInt(color.slice(1, 3), 16);
    const g: number = parseInt(color.slice(3, 5), 16);
    const b: number = parseInt(color.slice(5, 7), 16);
    const styleOptions = Object({
      "borderColor": color,
      "background": `linear-gradient(to top, rgba(${r}, ${g}, ${b}, ${1.0}) 0%, rgba(${r}, ${g}, ${b}, ${1.0}) ${fillRatio*100}%, rgba(${r}, ${g}, ${b}, ${0.0}) ${fillRatio*100}%, rgba(${r}, ${g}, ${b}, ${0.0}) 100%)`,
    });
    const title: string = `Difficulty: ${Math.round(difficultyClipped)}`;
    const circleId = 'DifficultyCircle-' + id;
    return (<>
      <span className="difficulty-circle" style={styleOptions} id={circleId}> 
      </span>
      <Tooltip
        placement="top"
        target={circleId}
        isOpen={tooltipOpen}
        toggle={() => this.setState({tooltipOpen: !tooltipOpen})}
      >
        {title}
      </Tooltip>
    </>);
  }
}

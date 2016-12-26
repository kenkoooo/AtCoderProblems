import {Row} from 'react-bootstrap';
import React, {Component} from 'react';
import c3 from 'c3';

class LineChart extends Component {
  componentDidMount() {
    this._updateChart();
  }
  componentDidUpdate() {
    this._updateChart();
  }
  _updateChart() {
    c3.generate({
      bindto: `#${this.props.name}`,
      data: {
        x: "x",
        columns: [this.props.ticks, this.props.data]
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            count: 10,
            format: '%Y-%m-%d'
          }
        }
      }
    });
  }
  render() {
    return (<Row className="placeholders" id={this.props.name}/>);
  }
}

export default LineChart;

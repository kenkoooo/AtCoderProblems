import {Row} from 'react-bootstrap';
import React, {Component} from 'react';
import c3 from 'c3';

class BarChart extends Component {
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
        columns: [
          this.props.ticks, this.props.data
        ],
        type: 'bar',
        colors: {
          Accepted: "#32CD32"
        }
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            count: 10,
            format: '%Y-%m-%d'
          }
        }
      },
      bar: {
        width: {
          ratio: 0.02 // this makes bar width 50% of length between ticks
        }
      }
    });
  }
  render() {
    return (<Row className="placeholders" id={this.props.name}/>);
  }
}

export default BarChart;

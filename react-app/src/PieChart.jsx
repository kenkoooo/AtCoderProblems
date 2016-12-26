import {Row, PageHeader, Col} from 'react-bootstrap';
import React, {Component} from 'react';
import c3 from 'c3';

class PieChart extends Component {
  componentDidMount() {
    this._updateChart();
  }
  componentDidUpdate() {
    this._updateChart();
  }
  _updateChart() {
    const chart = c3.generate({
      bindto: `#${this.props.name}`,
      size: {
        height: 200,
        width: 200
      },
      data: {
        columns: [
          [
            "Accepted", this.props.ac
          ],
          [
            "Trying", this.props.total - this.props.ac
          ]
        ],
        type: "pie",
        colors: {
          Accepted: "#32CD32",
          Trying: "#58616A"
        },
        order: null
      }
    });
  }
  render() {
    return <Col xs={6} sm={3} className="placeholders">
      <div id={this.props.name}>hi</div>
      <h4>{this.props.title}</h4>
      <span className="text-muted">{this.props.ac}問 / {this.props.total}問</span>
    </Col>;
  }
}

export default PieChart;

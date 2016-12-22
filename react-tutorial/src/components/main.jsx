/* @flow */
import React from 'react'
const T = React.PropTypes

module.exports = React.createClass({
    propTypes: {
      message: T.string.isRequired,
      date:    T.instanceOf(Date).isRequired
    },
    getInitialState() {
      return {
        text: 'Hello world!'
      }
    },
    render() {
      const t = this.state.text
      const m = this.props.message
      const d = this.props.date.toString()
      return ( 
        <div>{t}, {m}. ({d})</div>
      )  
    }
});

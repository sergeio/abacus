import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import './App.css';
import { Line } from 'react-chartjs';


import './client/inject';
import Dashboard from './Dashboard';


class App extends Component {
  static propTypes = {
    filteredEvents: PropTypes.arrayOf(PropTypes.any),
    getFilteredEvents: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.onChangeFilterKey = this.onChangeFilterKey.bind(this);
    this.onSubmitFilterValue = this.onSubmitFilterValue.bind(this);
    this.state = {
      filterKey: 'user_id',
      filterValue: 31,
    }
  }

  onChangeFilterKey(event) {
    this.setState({filterKey: event.target.value});
  }

  onSubmitFilterValue(value) {
    this.setState({filterValue: value});
    this.props.getFilteredEvents(this.state.filterKey, value);
  }

  render() {
    return (
      <div className="App">
          <Dashboard>
              <Dropdown
                values={[
                  'user_id', 'event_type', 'event_target', 'path', 'referrer',
                  'email', 'handle', 'platform', 'datetime', 'date',
                ]}
                onChange={ this.onChangeFilterKey }
              />
              <TextBox onSubmit={ this.onSubmitFilterValue } />
              <Chart data={this.props.filteredEvents} />
              <p>
                "{this.state.filterKey}"
                <br />
                "{this.state.filterValue}"
                <br />
              </p>
          </Dashboard>
      </div>
    );
  }

}

function mapDispatchToProps(dispatch) {
  return {
    getFilteredEvents: (filterKey, filterValue) => {
      fetch(
        (window.location.protocol + '//' + window.location.hostname +
          ':8080/events_by_day'),
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({filters: {[filterKey]: filterValue}}),
        }
      ).then((result) => result.json()
      ).then((data) => {
        dispatch({
          type: 'GOT_FILTERED_EVENTS',
          value: data,
        });
      }).catch((error) => console.log(error))
    }
  }
}

function mapStateToProps(state) {
  return {
    filteredEvents: state.filteredEvents || []
  }
}
App = connect(mapStateToProps, mapDispatchToProps)(App);


class Chart extends Component {

  static propTypes = {
    data: PropTypes.any,
  }

  /*
   * If no matching events happened on a particular day, it will be missing
   * from the data set.  We want to fill in those days, and mark them as
   * having 0 events.
   */
  dataWithoutGaps(dataWithGaps) {
    // Assumes data is sorted by date.
    const labels = [];
    const dataPoints = [];
    let expected = null;
    this.props.data.forEach(({count, date}) => {
      const day = new Date(date);
      if (!expected) expected = day;
      while (expected < day) {
        labels.push(expected.toDateString());
        dataPoints.push(0);
        // Increment date by 1 day
        expected.setDate(expected.getDate() + 1)
      }
      labels.push(day.toDateString());
      dataPoints.push(count);
      expected = new Date(day);
      expected.setDate(expected.getDate() + 1)
    });
    return {labels, dataPoints};
  }

  render() {
    const { labels, dataPoints } = this.dataWithoutGaps(this.props.data);
    const data = {
      labels: labels,
      datasets: [
        {
          label: "My First dataset",
          fillColor: "rgba(220,220,220,0.2)",
          strokeColor: "rgba(220,220,220,1)",
          pointColor: "rgba(220,220,220,1)",
          pointStrokeColor: "#fff",
          pointHighlightFill: "#fff",
          pointHighlightStroke: "rgba(220,220,220,1)",
          data: dataPoints
        },
      ]
    };
    return <Line data={data} options={{}} width="600" height="250"/>
  }
};


class Dropdown extends Component {

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    values: PropTypes.arrayOf(PropTypes.string.isRequired),
  }

  render() {
    const options = this.props.values.map((value) => {
      return <option key={value} value={value} > {value} </option>
    });

    return (
      <select onChange={this.props.onChange} >
        {options}
      </select>
    );
  }
}

class TextBox extends Component {

  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {value: ""};
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onSubmit(this.state.value);
  }

  onChange(event) {
    this.setState({value: event.target.value});
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} >
        <label>
          <input type="text" name="name" onChange={this.onChange}/>
        </label>
      </form>
    );
  }
}

export default App;

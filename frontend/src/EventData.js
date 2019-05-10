import React from 'react';
import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Line } from 'react-chartjs';
import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import EventSummary from './EventSummary';
import { getFilteredEventsWithDispatch } from './actions';


const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 200,
  },
});

class EventGraph extends Component {
  static propTypes = {
    filteredEvents: PropTypes.any,
    getFilteredEvents: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.onChangeFilterKey = this.onChangeFilterKey.bind(this);
    this.onSubmitFilterValue = this.onSubmitFilterValue.bind(this);
    this.state = { ...this.props.filteredEvents };
    this.props.getFilteredEvents(this.state.filterKey, this.state.filterValue);
  }

  onChangeFilterKey(event) {
    this.setState({filterKey: event.target.value});
  }

  onSubmitFilterValue(value) {
    this.setState({filterValue: value});
    this.props.getFilteredEvents(this.state.filterKey, value);
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <form>
          <FormControl className={classes.formControl}>
            <InputLabel> filter </InputLabel>
            <Select
              value={this.state.filterKey}
              onChange={this.onChangeFilterKey}
            >
              {[
                'user_id', 'event_type', 'event_target', 'path', 'referrer',
                'email', 'handle', 'platform', 'datetime', 'date',
              ].map((filter) => {
                return <MenuItem key={filter} value={filter}> {filter} </MenuItem>
              })}
            </Select>
          </FormControl>
        </form>

        <TextBox
          initialValue={this.state.filterValue}
          onSubmit={this.onSubmitFilterValue} />
        <Chart data={this.props.filteredEvents.data} />
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    getFilteredEvents: (filterKey, filterValue) => {
      return getFilteredEventsWithDispatch(dispatch, filterKey, filterValue);
    }
  }
}

function mapStateToProps(state) {
  const filteredEvents = state.filteredEvents.data ?
    { ...state.filteredEvents } :
    {data: [], filterKey: 'user_id', filterValue: '31'}
  return { filteredEvents }
}

EventGraph = connect(mapStateToProps, mapDispatchToProps)(EventGraph);
EventGraph = withStyles(styles)(EventGraph)

class EventData extends Component {

  static propTypes = {
  }

  render() {
    return (
      <Grid container >
        <Grid item xs={6}>
          <EventGraph />
        </Grid>
        <Grid item xs={6}>
          <EventSummary />
        </Grid>
      </Grid>
    )
  }

}

export default EventData;


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
    return <Line data={data} options={{}} width="500" height="250"/>
  }
};


class TextBox extends Component {

  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialValue: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = {value: this.props.initialValue};
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
        <Input value={this.state.value} onChange={this.onChange}/>
      </form>
    );
  }
}

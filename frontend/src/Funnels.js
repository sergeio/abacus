import React from 'react';
import { Component } from 'react';
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import IconArrowRight from '@material-ui/icons/ArrowRightAlt';

import { dataWithoutGaps } from './util'
import { get, post } from './client/util';

const styles = theme => ({
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 200,
  },
});


class Funnels extends Component {
  static propTypes = {
    eventNames: PropTypes.array,
    eventsByNameCache: PropTypes.object,
    getEventNames: PropTypes.func.isRequired,
    getEventsByName: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  makeStateUpdater(key) {
    let stateUpdater = (value) => {
      this.setState({[key]: value})
    }
    return stateUpdater.bind(this)
  }

  componentWillUpdate(nextProps, nextState) {
    if ((nextState.firstFilter !== this.state.firstFilter ||
         nextState.secondFilter !== this.state.secondFilter) &&
        nextState.firstFilter && nextState.secondFilter) {
      this.props.getEventsByName([nextState.firstFilter])
      this.props.getEventsByName(
        [nextState.firstFilter, nextState.secondFilter])
    }
  }

  componentDidMount() {
    this.props.getEventNames()
  }

  getDataSets() {
    const filters = [
      [this.state.firstFilter],
      [this.state.firstFilter, this.state.secondFilter]]
    const matchingEvents = [
      this.props.eventsByNameCache[filters[0]],
      this.props.eventsByNameCache[filters[1]]
    ]

    if (Object.keys(this.props.eventsByNameCache).length > 0 &&
        matchingEvents[0] && matchingEvents[1]) {
      return {
        [filters[0]]: matchingEvents[0],
        [filters[1]]: matchingEvents[1],
      }
    }
  }

  render() {
    return this.props.eventNames && (
      <Grid container >
        <Grid item xs={4}>
          <NameFilterSelector
            onChangeFilter={this.makeStateUpdater('firstFilter')}
            eventNames={this.props.eventNames}
          />
        </Grid>
        <IconArrowRight />
        <Grid item xs={4}>
          <NameFilterSelector
            onChangeFilter={this.makeStateUpdater('secondFilter')}
            eventNames={this.props.eventNames}
          />
        </Grid>
        <Grid item xs={5}>
          <FunnelBarGraph eventsByName={this.getDataSets()} />
        </Grid>
      </Grid>
    )
  }

}

function mapDispatchToProps(dispatch) {
  return {
    getEventNames: () => {
      get({
        resource: '/event_names',
        onSuccess: (response) => {
          const eventNames = response.data.map(row => row.event_name)
          dispatch({
            type: 'GOT_EVENT_NAMES',
            value: eventNames,
          })
        }
      })
    },
    getEventsByName: (filterNames) => {
      post({
        resource: '/events_query',
        data: {named_filters: filterNames},
        onSuccess: (data) => dispatch({
          type: 'GOT_EVENTS_BY_NAME',
          value: {[filterNames]: data},
        })
      })
    },
  }
}

function mapStateToProps(state) {
  return {
    eventNames: state.eventNames,
    eventsByNameCache: state.eventsByName,
  }
}

Funnels = connect(mapStateToProps, mapDispatchToProps)(Funnels);


class FunnelBarGraph extends Component {
  static propTypes = {
    eventsByName: PropTypes.object,
  }

  processEvents(eventsByName) {
    // Find the min and max date of both datasets
    let minDate, maxDate
    for (const key of Object.keys(eventsByName)) {
      const data = eventsByName[key]
      if (data.length === 0) continue
      const first = data[0].date
      const last = data[data.length - 1].date
      if (!minDate || first < minDate) minDate = first
      if (!maxDate || last > maxDate) maxDate = last
    }

    // Ensure both datasets have the same min and max dates
    for (const key of Object.keys(eventsByName)) {
      let data = eventsByName[key]
      // Maybe there is no data at all for this event
      if (data.length === 0) {
        eventsByName[key] = data = [{date: minDate, count: 0}]
      }
      const first = data[0].date
      const last = data[data.length - 1].date
      if (minDate && first > minDate) data.unshift({date: minDate, count: 0})
      if (maxDate && last < maxDate) data.push({date: maxDate, count: 0})
    }

    // Fill in any gaps in data (in case there were days without a single
    // matching event)
    const processedEvents = {
      labels: undefined,
      names: [],
      datasets: [],
    }
    for (const key of Object.keys(eventsByName)) {
      const { labels, dataPoints } = dataWithoutGaps(eventsByName[key]);
      processedEvents.labels = labels
      processedEvents.names.push(key)
      processedEvents.datasets.push(dataPoints)
    }

    return processedEvents

  }

  render() {
    if (!this.props.eventsByName) return ''
    const processedEvents = this.processEvents(this.props.eventsByName)

    const datasets = [
      {
        label: processedEvents.names[0],
        data: processedEvents.datasets[0],
        fillColor: "rgba(220,220,220,0.2)",
        pointColor: "rgba(220,220,220,1)",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        strokeColor: "rgba(220,220,220,1)",
      },
      {
        label: processedEvents.names[1],
        data: processedEvents.datasets[1],
        fillColor: "rgba(151,187,205,0.2)",
        pointColor: "rgba(151,187,205,1)",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(151,187,205,1)",
        pointStrokeColor: "#fff",
        strokeColor: "rgba(151,187,205,1)",
      }
    ]




    const data = {
      labels: processedEvents.labels,
      datasets: datasets,
    };
    return (
      <div>
        <Bar data={data} width='1000' height='500' redraw />
      </div>
    )
  }
}

class NameFilterSelector extends Component {
  static propTypes = {
    eventNames: PropTypes.array.isRequired,
    onChangeFilter: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.onChange = this.onChange.bind(this)
    this.state = {filterName: ''}
  }

  onChange(event) {
    event.preventDefault()
    this.setState({filterName: event.target.value})
    this.props.onChangeFilter(event.target.value)
  }

  render() {
    const { classes } = this.props;
    return (
      <form>
        <FormControl className={classes.formControl}>
          <InputLabel> Event Name </InputLabel>
          <Select
            value={this.state.filterName}
            onChange={this.onChange}
          >
            {this.props.eventNames && this.props.eventNames.map((name) => {
              return <MenuItem key={name} value={name}> {name} </MenuItem>
            })}
          </Select>
        </FormControl>
      </form>
    )
  }

}
NameFilterSelector = withStyles(styles)(NameFilterSelector)

export default Funnels

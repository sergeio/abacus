import React from 'react';
import { Component } from 'react';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { get, post } from './client/util';


class EventSummary extends Component {
  static propTypes = {
    popularEvents: PropTypes.any,
    getEventsByType: PropTypes.func.isRequired,
    saveEventName: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {tempNames: {}}
  }

  componentDidMount() {
    this.props.getEventsByType()
  }

  static computeEventKey(event) {
    return `${event.event_type} | ${event.event_target}`;
  }

  getEventName(event) {
    return this.state.tempNames[EventSummary.computeEventKey(event)]
  }

  createSetTempnameCallback(event) {
    let setTempNameCallback = (tempName) => {
      this.setTempName(event, tempName)
    }
    setTempNameCallback = setTempNameCallback.bind(this)
    return setTempNameCallback
  }

  setTempName(event, tempName) {
    this.setState((state) => {
      const eventKey = EventSummary.computeEventKey(event)
      const newTempNames = {
        ...state.tempNames,
        ...{[eventKey]: tempName},
      }
      return {tempNames: newTempNames}
    })
    this.props.saveEventName(event, tempName)
  }

  render() {
    console.log(this.state.tempNames)
    const events = this.props.popularEvents &&
      this.props.popularEvents.data &&
      this.props.popularEvents.data.map((event) => {
        return <NameableEvent
          key={EventSummary.computeEventKey(event)}
          eventType={event.event_type}
          eventTarget={event.event_target}
          eventName={this.getEventName(event) || event.event_name}
          setTempName={this.createSetTempnameCallback(event)}
        />
      });
    return (
      <Table>
        <TableBody>
          {events}
        </TableBody>
      </Table>
    );
  }

}


function mapDispatchToProps(dispatch) {
  return {
    getEventsByType: () => {
      get({
        resource: '/popular_events',
        onSuccess: (data) => dispatch({
          type: 'GOT_POPULAR_EVENTS',
          value: data,
        })
      })
    },
    saveEventName: (event, name) => {
      post({
        resource: '/new_event_name',
        data: {
          event_target: event.event_target,
          event_type: event.event_type,
          event_name: name,
        },
        onSuccess: (data) => dispatch({
          type: 'SAVED_EVENT_NAME_SUCCESSFULLY',
          value: data,
        }),
        onError: (data) => {
          console.log('Error saving event name')
        }
      })
    }
  }
}


function mapStateToProps(state) {
  return {
    popularEvents: state.popularEvents,
  }
}

class NameableEvent extends Component {
  static propTypes = {
    eventName: PropTypes.string,
    eventTarget: PropTypes.string.isRequired,
    eventType: PropTypes.string.isRequired,
    setTempName: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      currentlyNaming: false,
      tempName: this.props.eventName || '',
    }
    this.onClickButton = this.onClickButton.bind(this)
    this.submitEventName = this.submitEventName.bind(this)
    this.onChangeEventName = this.onChangeEventName.bind(this)
    this.escFunction = this.escFunction.bind(this)
  }

  submitEventName(event) {
    event.preventDefault()
    this.props.setTempName(this.state.tempName)
    this.setState({currentlyNaming: false})
  }

  onChangeEventName(event) {
    event.preventDefault()
    this.setState({tempName: event.target.value})
  }

  onClickButton(event) {
    this.setState({currentlyNaming: true})
  }

  escFunction(event){
    // Revert name-setting when <esc> key is pressed
    if(event.keyCode === 27) {
      this.setState({currentlyNaming: false, tempName: this.props.eventName})
    }
  }
  componentDidMount(){
    document.addEventListener("keydown", this.escFunction, false);
  }
  componentWillUnmount(){
    document.removeEventListener("keydown", this.escFunction, false);
  }

  render() {
    return (
      <TableRow>
        <TableCell>{this.props.eventType}</TableCell>
        <TableCell>
          {this.state.currentlyNaming ?
              <form onSubmit={this.submitEventName}>
                <Input
                  autoFocus
                  type='text'
                  fullWidth
                  value={this.state.tempName}
                  onChange={this.onChangeEventName}
                />
              </form>
              :
              this.props.eventName || this.props.eventTarget
          }
        </TableCell>
        <TableCell align='right'>
          {!this.state.currentlyNaming &&
              <Button size='small' onClick={this.onClickButton}>+name</Button>
          }
        </TableCell>
      </TableRow>
    )
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(EventSummary);

import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { get, post } from './client/util';


class EventData extends Component {
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
    return this.state.tempNames[EventData.computeEventKey(event)]
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
      const eventKey = EventData.computeEventKey(event)
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
          key={EventData.computeEventKey(event)}
          eventType={event.event_type}
          eventTarget={event.event_target}
          eventName={this.getEventName(event) || event.event_name}
          setTempName={this.createSetTempnameCallback(event)}
        />
      });
    return (
      <div className='eventData'>
        {events}
      </div>
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
  }

  submitEventName(event) {
    event.preventDefault()
    console.log(this.state.tempName)
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

  render() {
    const button = <button onClick={this.onClickButton}>+name</button>;
    const unnamedEvent = (
      <div className='nameableEvent'>
        <div className='eventType'>
          {this.props.eventType}
        </div>
        <div className='eventTarget'>
          {this.props.eventTarget}
        </div>
        {button}
      </div>
    );
    const namedEvent = (
      <div className='eventName'>
        {this.props.eventName}
        {button}
      </div>
    );
    const textbox = <form onSubmit={this.submitEventName}>
      <label>
        <input
          autoFocus
          type='text'
          value={this.state.tempName}
          onChange={this.onChangeEventName}
        />
      </label>
    </form>

    if (this.state.currentlyNaming) {
      return textbox;
    } else if (this.props.eventName) {
      return namedEvent;
    } else {
      return unnamedEvent;
    }
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(EventData);

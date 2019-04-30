import React from 'react';
import { Component } from 'react';
import PropTypes from 'prop-types';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.onChangeFilterKey = this.onChangeFilterKey.bind(this);
    this.onSubmitFilterValue = this.onSubmitFilterValue.bind(this);
    this.state = {
      filter_key: 'user_id',
      filter_value: 31,
    }
  }

  onChangeFilterKey(key) {
    this.setState({filter_key: key});
  }

  onSubmitFilterValue(value) {
    this.setState({filter_value: value});
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <Dropdown values={['a', 'b']} onChange={ this.onChangeFilterKey} />
          <TextBox onSubmit={ this.onSubmitFilterValue }/>
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            "{this.state.filter_key}"
            <br />
            "{this.state.filter_value}"
            <br />
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }

}

class Dropdown extends Component {

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    values: PropTypes.arrayOf(PropTypes.string.isRequired),
  }

  render() {
    const options = this.props.values.map((value) => {
      return <option key={value} value={value}> {value} </option>
    });

    return (
      <select>
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

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Filesharer from './filesender.js';
import Dwv from './DwvComponent';
import {Provider} from 'react-redux';
import Redux from 'redux';

const reducer;
const store = Redux.createStore();
var options = {
  peerjs_key: 'your peerjs key'
}
class App extends Component {
  render() {
    return (
      <div>
          <Filesharer></Filesharer>
          <Dwv></Dwv>
      </div>
    );
  }
}

export default App;

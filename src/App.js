import React, { Component } from 'react';
import './App.css';
import Filesharer from './Component/filesender/filesender.js';
import Dwv from './Component/dwv/DwvComponent';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import Reducer from './Redux/Reducer';

const store = createStore(Reducer);
var options = {
  peerjs_key: 'your peerjs key'
}
class App extends Component {
  render() {
    return (
      <Provider store = {store}>
          <Filesharer></Filesharer>
          <Dwv></Dwv>
      </Provider>       
    );
  }
}

export default App;

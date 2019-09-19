import React, { Component } from "react";
import { render } from "react-dom"
import { BrowserRouter as Router, Route } from "react-router-dom";

import Header from "./header"
import Footer from "./footer"
import Tool from "./tool"
import Examples from "./examples"
import Internals from "./internals"

import { Provider } from 'react-redux';
import { store } from './store';

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Router>
          <div>
            <Header />
            <Route exact path="/" component={Tool} />
            <Route path="/examples" component={Examples} />
            <Route path="/internals" component={Internals} />
            <Footer />
          </div>
        </Router>
      </Provider>
    );
  }
}

render(<App />, document.getElementById('main'));
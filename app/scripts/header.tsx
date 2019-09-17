import React, { Component } from "react";
import { connect } from "react-redux"
import { Link, withRouter } from "react-router-dom"
import { State as StoreState, WasmStatus } from "./store"

type HeaderProps = {
  wasmStatus: WasmStatus
}

class Header extends Component<HeaderProps> {
  render() {
    return (
      <header className="site-header" role="banner">
        <div className="wrapper container">
          <div className="row">
            <div className="col-md-4">
              <a className="site-title">WasmDB</a>
            </div>
            <div className="col-md-4">
              <nav className="site-nav">
                <Link to="/">Tool</Link>
                <Link to="/examples">Examples</Link>
                <Link to="/internals">Internals</Link>
              </nav>
            </div>
            <div className="col-md-4 d-flex justify-content-left">
              <div id="process-button-spinner" className="spinner-border" role="status"
                    hidden={this.props.wasmStatus === "idle"}>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }
}

function mapStateToProps(state: { store: StoreState }): HeaderProps {
  return {
    wasmStatus: state.store.wasmStatus
  }
}

// @ts-ignore
export default withRouter(connect(
  mapStateToProps,
  null
)(Header));

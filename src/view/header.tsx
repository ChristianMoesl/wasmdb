/*import React, { Component } from "react";
import { connect } from "react-redux"
import { Link, withRouter } from "react-router-dom"
import { State as StoreState, EngineStatus } from "../store"

type HeaderProps = {
  engineStatus: EngineStatus
}

class Header extends Component<HeaderProps> {
  render() {
    return (
      <header className="site-header" role="banner">
        <div className="container">
          <div className="row">
            <div className="d-flex col-10 col-md-4 justify-content-md-end">
              <a className="site-title">WasmDB</a>
            </div>
            <div className="d-flex col-12 col-md-4 justify-content-md-start order-2 order-md-1">
              <nav className="my-site-nav">
                <Link to="/" className="my-page-link">Tool</Link>
                <Link to="/examples" className="my-page-link">Examples</Link>
                <Link to="/internals" className="my-page-link">Internals</Link>
              </nav>
            </div>
            <div id="spinner-wrapper" className="col-2 col-md-4 d-flex justify-content-end order-1 order-md-2">
              <div className="spinner-border" role="status"
                   hidden={this.props.engineStatus === "idle"}>
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
    engineStatus: state.store.engineStatus
  }
}

// @ts-ignore
export default withRouter(connect(
  mapStateToProps,
  null
)(Header));
*/

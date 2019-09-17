import React, { Component } from "react";
import { Link } from "react-router-dom"

export default class Footer extends Component {
  render() {
    return (
      <footer className="site-footer">
        <div className="wrapper">
          <div className="d-flex justify-content-center">
            <span>Copyright Purdue University</span>
          </div>
        </div>
      </footer>
    )
  }
}
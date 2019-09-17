import * as React from 'react';

export default class Examples extends React.Component {
  state = {
    count: 0
  }

  increment = () => {
    this.setState({
      count: (this.state.count + 1)
    });
  }

  decrement = () => {
    this.setState({
      count: (this.state.count - 1)
    });
  }

  render() {
    return (
      <div>
      </div>
    )
  }
}
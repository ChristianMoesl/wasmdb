import React, { Component } from "react";
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { List } from "immutable"
import { State as StoreState } from "../store"

type InternalsActionProps = {
}

type InternalsStoreProps = {
}

type InternalsProps = InternalsActionProps & InternalsStoreProps

class Internals extends Component<InternalsProps> {
  //private logView = React.createRef<FixedSizeList>()

  //componentDidMount() {
    //this.scrollLogViewToEnd()
  //}

  //componentDidUpdate() {
    //if (this.props.logUpdated) {
      //this.scrollLogViewToEnd()

      //this.props.resetLogUpdated()
    //}
  //}

  //scrollLogViewToEnd() {
    //const newIdx = this.props.logMessages.size
    //this.logView!.current!.scrollToItem(newIdx)
  //}

  render() {
    return (
    <div className="container">
     </div>
    )
  }
}
      //<section id="log-section">
          //<h4>Execution Log</h4>
          //<figure className="highlight">
            //<FixedSizeList
            //ref={this.logView}
            //className="List"
            //height={100}
            //itemCount={this.props.logMessages.size}
            //itemSize={30}
            //width={"100%"}>
            //{(row: { index: number, style: any }) =>
              //<div style={row.style}>
                //{this.props.logMessages.get(row.index)!.date}
                //<strong>{this.props.logMessages.get(row.index)!.msg}</strong><br />
              //</div>
            //}
            //</FixedSizeList>
          //</figure>
        //</section>
 
function mapDispatchToProps(dispatch: React.Dispatch<any>): InternalsActionProps {
  return {
  }
}

function mapStateToProps(state: { store: StoreState }): InternalsStoreProps {
  return {
  }
}

// @ts-ignore
export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(Internals));

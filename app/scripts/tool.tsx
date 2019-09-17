import * as React from "react";
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { FixedSizeList, VariableSizeList } from "react-window";

import { engine } from "./engine";
import { State as StoreState, changeQuery, appendLog, resetLogUpdated } from "./store"


type ToolActions = {
  changeQuery: (query: string) => void,
  appendLog: (msg: string) => void,
  resetLogUpdated: () => void
}

type ToolProps = StoreState & ToolActions

class Tool extends React.Component<ToolProps> {

  constructor(props: ToolProps) {
    super(props)
  }

  handleQueryChange(query: string) {
    this.props.changeQuery(query)
  }

  handleFileSelect(fileList: FileList) {
    engine.loadFiles(fileList)
  }

  executeClicked() {
    engine.executeQuery(this.props.query)
  }

  resetClicked() {
    engine.reset()
  }

  calculateRowHeight(idx: number) {
    return this.props.resultFragments.get(idx)!.split("\n").length * 24
  }

  transformFileList() {
    return this.props.filesLoaded.map(file => { return {
        name: escape(file.name),
        details: `(${file.type || "n/a"}) - ${file.size} bytes`
    }})
  }

  render() {
    return (
      <div className="container">
        <section id="file-section">
          <h3>1. Select CSV files as data source</h3>
          <div className="d-flex justify-content-left">
            <label id="load-button" className="btn my-button btn-file">
                Choose Files <input type="file" id="files" name="files[]"
                              onChange={ (e: any) => this.handleFileSelect(e.target.files)}
                              disabled={this.props.wasmStatus !== "idle"}
                              multiple accept="text/csv" style={{ display: "none" }} />
            </label>
          </div>
          <output id="list">
            {this.transformFileList().map((file, key) => <span key={key}><strong>{file.name}</strong>{file.details}</span>)}
          </output>
        </section>

        <section id="query-section">
          <h3>2. Write SQL query</h3>
          <textarea name="textarea" id="query" value={this.props.query}
                    onChange={(e: any) => this.handleQueryChange(e.target.value)}
                    className="code form-control"></textarea>
          <div className="d-flex justify-content-left">
            <button id="process-button" className="btn my-button" type="button"
                    disabled={this.props.wasmStatus !== "idle"}
                    onClick={ (e: any) => this.executeClicked() }  >Process</button>
          </div>
          <button className="btn my-button" type="button"
                  onClick={ (e: any) => this.resetClicked() }>Reset</button>
        </section>

        <section id="result-section">
          <h4>Results</h4>
          <figure className="highlight">
            <VariableSizeList
            className="List"
            height={400}
            itemCount={this.props.resultFragments.size}
            itemSize={idx => this.calculateRowHeight(idx)}
            width={"100%"}>
            {(row: { index: number, style: any }) =>
                <div style={row.style}>{
                  this.props.resultFragments.get(row.index)!.split("\n")
                  .map((line, key) => <div key={key}>{line}</div>)
                }</div>}
            </VariableSizeList>
            <div id="results" style={{ width: "100%" }}></div>
          </figure>
        </section>
      </div>
    )
  }
}

function mapStateToProps(state: { store: StoreState }): StoreState {
  return {
    query: state.store.query,
    filesLoaded: state.store.filesLoaded,
    logMessages: state.store.logMessages,
    resultFragments: state.store.resultFragments,
    logUpdated: state.store.logUpdated,
    wasmStatus: state.store.wasmStatus
  }
}

function mapDispatchToProps(dispatch: React.Dispatch<any>): ToolActions {
  return {
    changeQuery: query => dispatch(changeQuery(query)),
    appendLog: msg =>  dispatch(appendLog(msg)),
    resetLogUpdated: () => dispatch(resetLogUpdated())
  }
}
// @ts-ignore
export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(Tool));

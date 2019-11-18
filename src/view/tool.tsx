import * as React from "react";
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { VariableSizeList } from "react-window"
import { Button, Box, Container, Grid, Typography } from "@material-ui/core"
import { makeStyles, useTheme, Theme, createStyles, ThemeProvider } from '@material-ui/core/styles';

import CsvFilePicker from "./csv-file-picker"
import SqlInput from "./sql-input"

import { State as StoreState, changeQuery, appendLog, resetLogUpdated } from "../store"



const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      spacing: theme.spacing(3)
    }
  })
)

type ToolActions = {
  changeQuery: (query: string) => void,
  appendLog: (msg: string) => void,
  resetLogUpdated: () => void
}

type ToolProps = 
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

class Tool extends React.Component<ToolProps> {

  constructor(props: ToolProps) {
    super(props)
  }

  handleQueryChange(query: string) {
    this.props.changeQuery(query)
  }

  handleFileSelect(fileList: FileList) {
   // engine.loadFiles(fileList)
  }

  executeClicked() {
   // engine.executeQuery(this.props.query)
  }

  resetClicked() {
   // engine.reset()
  }

  saveClicked() {
   // engine.saveResult("results.csv")
  }

  calculateRowHeight(idx: number) {
    return this.props.resultFragments.get(idx)!.split("\n").length * 24
  }

  transformFileList() {
    return [{ name: "bla", details: "bla"}]
    /*return this.props.filesLoaded.map(file => { return {
        name: escape(file.name),
        details: `(${file.type || "n/a"}) - ${file.size} bytes`
    }})*/
  }

  render() {
    return (
      <main>
      <Container maxWidth="md">
        <Box>
          <Typography variant="h4">
            Tables
          </Typography>
        </Box>
        <CsvFilePicker />
        <Box>
          <Typography variant="h4">
            Tables
          </Typography>
        </Box>
        <SqlInput />



        <section id="result-section">
          <div className="row">
            <div className="col-6"><h3>Results</h3></div>
            <div className="col-6 d-flex justify-content-end">
              <button className="btn my-button" type="button"
                      disabled={this.props.engineStatus !== "idle" || this.props.resultFragments.size === 0}
                      onClick={ (e: any) => this.saveClicked() }>Save</button>
            </div>
          </div>

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
      </Container>
      </main>
    )
  }
}

function mapStateToProps(state: { store: StoreState }) {
  return {
    query: state.store.query,
    filePreviews: state.store.filePreviews,
    logMessages: state.store.logMessages,
    resultFragments: state.store.resultFragments,
    logUpdated: state.store.logUpdated,
    engineStatus: state.store.engineStatus,
    engineError: state.store.engineError
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

import * as React from "react";
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { Box, Container, Typography, Paper } from "@material-ui/core"
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

import CsvFilePicker from "./csv-file-picker"
import SqlInput from "./sql-input"
import {CsvTable} from "./csv-table"
import {Log} from "./log"

import { 
  State as StoreState, 
  changeQuery, 
  showLog,
  hideLog,
  appendLog, 
  loadFiles,
  saveFile,
  removeFile,
  executeQuery,
} from "../store"


type ToolProps = 
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

function Tool(props: ToolProps) {
  function handleLogExpansionChange(event: object, expanded: boolean) {
    if (expanded) props.showLog()
    else props.hideLog()
  }

  return (
    <main>
    <Container maxWidth="md">
      <Box my={1}>
        <Typography variant="h4">
          Tables
        </Typography>
      </Box>
      <Box mb={3}>
      <CsvFilePicker 
        filePreviews={props.filePreviews}
        loadFiles={props.loadFiles}
        removeFile={props.removeFile} />
      </Box>

      <Box width={1} mb={3}>
        <SqlInput 
          query={props.query}
          changeQuery={props.changeQuery}
          executeQuery={props.executeQuery}
          expanded={props.logDisplayed}
          onExpansionChange={handleLogExpansionChange}
          >
          <Log
            title="Log"
            messages={props.logMessages}
          />
        </SqlInput>
       </Box>

       {props.result && 
        <Box my={3}>
          <Paper style={{ height: 400, width: '100%' }}>
            <CsvTable 
              csvHeader={props.result!.csvHeader || ""}
              csvData={props.result!.csvData}
              saveFile={props.saveFile} />
          </Paper>
        </Box>}
    </Container>
    </main>
  )
}

function mapStateToProps(state: StoreState) {
  return {
    query: state.query,
    filePreviews: state.filePreviews,
    logMessages: state.logMessages,
    logDisplayed: state.logDisplayed,
    result: state.result,
    engineStatus: state.engineStatus,
    engineError: state.engineError
  }
}

function mapDispatchToProps(dispatch: React.Dispatch<any>) {
  return {
    changeQuery: (query: string) => dispatch(changeQuery(query)),
    executeQuery: () => dispatch(executeQuery()),
    loadFiles: (files: FileList) => dispatch(loadFiles(files)),
    saveFile: (name:  string) => dispatch(saveFile(name)),
    removeFile: (name: string) => dispatch(removeFile(name)),
    appendLog: (msg: string) =>  dispatch(appendLog(msg)),
    showLog: () => dispatch(showLog()),
    hideLog: () => dispatch(hideLog()),
  }
}

// @ts-ignore
export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(Tool));

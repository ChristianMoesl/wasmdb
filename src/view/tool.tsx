import * as React from "react";
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import { Box, Container, Typography } from "@material-ui/core"
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

import CsvFilePicker from "./csv-file-picker"
import SqlInput from "./sql-input"
import CsvTable from "./csv-table"

import { 
  State as StoreState, 
  changeQuery, 
  appendLog, 
  resetLogUpdated, 
  loadFiles,
  saveFile,
  removeFile,
  executeQuery,
} from "../store"


type ToolProps = 
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

function Tool(props: ToolProps) {
  return (
    <main>
    <Container maxWidth="md">
      <Box>
        <Typography variant="h4">
          Tables
        </Typography>
      </Box>
      <CsvFilePicker 
        filePreviews={props.filePreviews}
        loadFiles={props.loadFiles}
        removeFile={props.removeFile} />

      <Box>
        <Typography variant="h4">
          Tables
        </Typography>
      </Box>
      
     <SqlInput 
        query={props.query}
        changeQuery={props.changeQuery}
        executeQuery={props.executeQuery} />

      <CsvTable 
        fragments={props.resultFragments}
        saveFile={props.saveFile} />
    </Container>
    </main>
  )
}

function mapStateToProps(state: StoreState) {
  return {
    query: state.query,
    filePreviews: state.filePreviews,
    logMessages: state.logMessages,
    resultFragments: state.resultFragments,
    logUpdated: state.logUpdated,
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
    resetLogUpdated: () => dispatch(resetLogUpdated()),
  }
}

// @ts-ignore
export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(Tool));

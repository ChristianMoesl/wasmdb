import * as React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Box, Container, Typography, Paper, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { readFileSync } from "fs";
import SaveIcon from "@material-ui/icons/Save";

import CsvFilePicker from "./csv-file-picker";
import SqlInput from "./sql-input";
import { CsvTable } from "./csv-table";
import { Log } from "./log";
import Markdown from "./markdown";

import {
  State as StoreState,
  changeQuery,
  showLog,
  hideLog,
  appendLog,
  loadFiles,
  removeFile,
  executeQuery,
} from "../store";

type ToolProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

const style = makeStyles({
  paper: {
    height: 800,
    width: "100%",
  },
  buttonWrapper: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});

function Tool(props: ToolProps) {
  function handleLogExpansionChange(_event: object, expanded: boolean) {
    if (expanded) props.showLog();
    else props.hideLog();
  }

  const DownloadBehavior = React.useMemo(
    () =>
      React.forwardRef((buttonProps, ref) => (
        <a
          ref={ref as any}
          href={props.downloadUrl || ""}
          download="result.csv"
          {...buttonProps}
        >
          {buttonProps.children}
          Save
        </a>
      )),
    [props]
  );

  const classes = style();

  return (
    <main>
      <Container maxWidth="md">
        <Box my={1}>
          <Typography variant="h4">Tables</Typography>
        </Box>
        <Box mb={3}>
          <CsvFilePicker
            filePreviews={props.filePreviews}
            loadFiles={props.loadFiles}
            removeFile={props.removeFile}
          />
        </Box>

        <Box width={1} mb={3}>
          <SqlInput
            query={props.query}
            changeQuery={props.changeQuery}
            executeQuery={props.executeQuery}
            expanded={props.logDisplayed}
            onExpansionChange={handleLogExpansionChange}
          >
            <Log title="Log" messages={props.logMessages} />
          </SqlInput>
        </Box>

        {props.result && (
          <Box my={3}>
            <Box m={3} className={classes.buttonWrapper}>
              {props.downloadUrl && (
                <Button
                  variant="contained"
                  color="primary"
                  component={DownloadBehavior as any}
                  startIcon={<SaveIcon />}
                />
              )}
            </Box>
            <Paper className={classes.paper}>
              <CsvTable
                csvHeader={props.result!.csvHeader || ""}
                csvData={props.result!.csvData}
              />
            </Paper>
          </Box>
        )}
      </Container>
    </main>
  );
}

function mapStateToProps(state: StoreState) {
  return {
    query: state.query,
    filePreviews: state.filePreviews,
    logMessages: state.logMessages,
    logDisplayed: state.logDisplayed,
    result: state.result,
    downloadUrl: state.downloadUrl,
    engineStatus: state.engineStatus,
    engineError: state.engineError,
  };
}

function mapDispatchToProps(dispatch: React.Dispatch<any>) {
  return {
    changeQuery: (query: string) => dispatch(changeQuery(query)),
    executeQuery: () => dispatch(executeQuery()),
    loadFiles: (files: FileList) => dispatch(loadFiles(files)),
    removeFile: (name: string) => dispatch(removeFile(name)),
    appendLog: (msg: string) => dispatch(appendLog(msg)),
    showLog: () => dispatch(showLog()),
    hideLog: () => dispatch(hideLog()),
  };
}

// @ts-ignore
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Tool));

import React, { Component } from "react";
import { List } from "immutable";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Grid,
  Table,
  TableRow,
  TableCell,
  Typography,
  TableBody,
  Icon,
} from "@material-ui/core";
import {
  Add as AddIcon,
  DeleteRounded as DeleteIcon,
} from "@material-ui/icons";
import {
  State as StoreState,
  loadFiles,
  removeFile,
  FilePreview,
} from "../store";

const useTableStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      overflowX: "auto",
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(1),
    },
    table: {
      //  minWidth: 650,
      overflowX: "auto",
    },
    title: {
      flex: "1 1 100%",
      color: theme.palette.text.primary,
    },
    paper: {
      padding: theme.spacing(2),
      color: theme.palette.text.secondary,
    },
    deleteButton: {
      position: "relative",
      top: -30,
      left: -30,
      height: 40,
      width: 40,
      minWidth: 0,
      minHeight: 0,
      borderRadius: 20,
    },
  })
);

type FilePreviewProps = {
  file: FilePreview;
  removeFile: (name: string) => void;
};

function FilePreviewTable(props: FilePreviewProps) {
  const classes = useTableStyles();

  function delimiter(line: string) {
    const arr = line.split("");

    const countChar = (c: string) =>
      arr.reduce((l, r) => l + (r === c ? 1 : 0), 0);

    const possibleDelimiters = [",", ";", "\t"];

    const counts = possibleDelimiters.map((d) => countChar(d));
    const idx = counts.indexOf(Math.max.apply(Math, counts));

    return possibleDelimiters[idx];
  }

  function splitLines(lines: string[]) {
    if (lines.length === 0) return [];

    const delim = delimiter(lines[0]);

    return lines.map((line) => line.split(delim));
  }

  function columns(lines: string[]) {
    if (lines.length === 0) return 2;

    const delim = delimiter(lines[0]);
    const cols = lines[0].split(delim).length;

    return cols;
  }

  function minMax(
    n: number,
    min: number,
    max: number
  ): 2 | 1 | 3 | 12 | 6 | 4 | 5 | 7 | 8 | 9 | 10 | 11 {
    // @ts-ignore
    return Math.max(Math.min(n, max), min);
  }

  const xs = (lines: string[]) => minMax(columns(lines) * 3, 6, 12);
  const sm = (lines: string[]) => minMax(columns(lines) * 2, 4, 12);
  const md = (lines: string[]) => minMax(columns(lines), 4, 12);

  return (
    <Grid
      item
      xs={xs(props.file.contentPreview)}
      sm={sm(props.file.contentPreview)}
      md={md(props.file.contentPreview)}
    >
      <Paper className={classes.paper}>
        <Button
          className={classes.deleteButton}
          variant="contained"
          color="secondary"
          onClick={() => props.removeFile(props.file.name)}
        >
          <DeleteIcon />
        </Button>
        <Typography className={classes.title} variant="h6" id="tableTitle">
          {props.file.name}
        </Typography>
        <Box overflow="auto">
          <Table className={classes.table} aria-label="caption table">
            <caption>{`(${props.file.type || "n/a"}) - ${
              props.file.size
            } bytes`}</caption>
            <TableBody>
              {splitLines(props.file.contentPreview).map((row, idx) => (
                <TableRow key={idx}>
                  {row.map((cell, i) => (
                    <TableCell key={i}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Grid>
  );
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
  })
);

export type Props = {
  disabled: boolean;
  filePreviews: List<FilePreview>;
  loadFiles: (files: FileList) => void;
  removeFile: (name: string) => void;
};

export default function CsvFilePicker(props: Props) {
  const classes = useStyles();

  return (
    <div style={{ width: "100%" }}>
      <Box className={classes.root} display="flex" flexWrap="wrap">
        <Grid
          container
          spacing={3}
          direction="row"
          justify="center"
          alignItems="flex-start"
        >
          {props.filePreviews.map((file, key) => (
            <FilePreviewTable
              file={file}
              key={key}
              removeFile={props.removeFile}
            />
          ))}
          <Grid item xs={12} sm={8} md={4}>
            <input
              hidden
              accept="text/csv"
              id="file-add-button"
              multiple
              type="file"
              name="files[]"
              onChange={(e: any) => props.loadFiles(e.target.files as FileList)}
            />
            <label htmlFor="file-add-button">
              <Button variant="contained" component="span" fullWidth>
                <AddIcon />
              </Button>
            </label>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

CsvFilePicker.defaultProps = {
  disabled: false,
  filePreviews: List<FilePreview>(),
  // tslint:disable:no-empty
  loadFiles: () => {},
  removeFile: () => {},
};

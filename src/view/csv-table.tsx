// tslint:disable:no-shadowed-variable

import React from "react"
import {List} from "immutable"

import clsx from 'clsx';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import Paper from '@material-ui/core/Paper';
import { AutoSizer, Column, Table, TableCellRenderer, TableHeaderProps, TableCellDataGetter } from 'react-virtualized';


const styles = (theme: Theme) =>
  createStyles({
    flexContainer: {
      display: 'flex',
      alignItems: 'center',
      boxSizing: 'border-box',
    },
    table: {
      // temporary right-to-left patch, waiting for
      // https://github.com/bvaughn/react-virtualized/issues/454
      '& .ReactVirtualized__Table__headerRow': {
        flip: false,
        paddingRight: theme.direction === 'rtl' ? '0px !important' : undefined,
      },
    },
    tableRow: {
      cursor: 'pointer',
    },
    tableRowHover: {
      '&:hover': {
        backgroundColor: theme.palette.grey[200],
      },
    },
    tableCell: {
      flex: 1,
    },
    noClick: {
      cursor: 'initial',
    },
  });

interface ColumnData {
  dataKey: string;
  label: string;
  numeric?: boolean;
  width: number;
}

interface Row {
  index: number;
}

export interface CsvTableProps extends WithStyles<typeof styles> {
  csvHeader: string,
  csvData: List<string>,
  delimiter?: string,
  headerHeight?: number;
  rowHeight?: number;
  onRowClick?: () => void;
}

function CsvTableUnstyled(props: CsvTableProps) {

  const columns: ColumnData[] = props.csvHeader.split(props.delimiter!)
    .map((c: string, i: number) => ({ dataKey: i.toString(), label: c, width: 150 }))

  const getRowClassName = ({ index }: Row) => {
    const { classes, onRowClick } = props;

    return clsx(classes.tableRow, classes.flexContainer, {
      [classes.tableRowHover]: index !== -1 && onRowClick != null,
    });
  };

  const cellRenderer: TableCellRenderer = ({ cellData, columnIndex }) => {
    const { classes, rowHeight, onRowClick } = props;
    return (
      <TableCell
        component="div"
        className={clsx(classes.tableCell, classes.flexContainer, {
          [classes.noClick]: onRowClick == null,
        })}
        variant="body"
        style={{ height: rowHeight }}
        align={(columnIndex != null && columns[columnIndex].numeric) || false ? 'right' : 'left'}
      >
        {cellData}
      </TableCell>
    )
  }

  const cellDataGetter: TableCellDataGetter = ({ dataKey, rowData }) =>
    rowData.split(props.delimiter)[parseInt(dataKey, 10)]

  const headerRenderer = ({ label, columnIndex }: TableHeaderProps & { columnIndex: number }) => {
    const { headerHeight,  classes } = props;

    return (
      <TableCell
        component="div"
        className={clsx(classes.tableCell, classes.flexContainer, classes.noClick)}
        variant="head"
        style={{ height: headerHeight }}
        align={columns[columnIndex].numeric || false ? 'right' : 'left'}
      >
        <span>{label}</span>
      </TableCell>
    );
  };

  const rowGetter = ({ index }: { index: number }) => props.csvData.get(index)

  const { classes,  rowHeight, headerHeight, ...tableProps } = props;
  return (
    <AutoSizer>
      {({ height, width }) => (
        <Table
          height={height}
          width={width}
          rowHeight={rowHeight!}
          gridStyle={{
            direction: 'inherit',
          }}
          headerHeight={headerHeight!}
          className={classes.table}
          rowCount={props.csvData.size}
          rowGetter={rowGetter}
          {...tableProps}
          rowClassName={getRowClassName}
        >
          {columns.map(({ dataKey, ...other }, index) => {
            return (
              <Column
                key={dataKey}
                headerRenderer={headerProps =>
                  headerRenderer({
                    ...headerProps,
                    columnIndex: index,
                  })
                }
                className={classes.flexContainer}
                cellRenderer={cellRenderer}
                cellDataGetter={cellDataGetter}
                dataKey={dataKey}
                {...other}
              />
            );
          })}
        </Table>
      )}
    </AutoSizer>
  );
}

CsvTableUnstyled.defaultProps = {
  headerHeight: 48,
  rowHeight: 48,
  delimiter: ",",
}

export const CsvTable = withStyles(styles)(CsvTableUnstyled);

import React, {
  PropsWithChildren,
  SyntheticEvent,
} from "react"

import {
  FormControl,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
} from "@material-ui/core"

import {
  makeStyles,
  createStyles,
  Theme,
} from '@material-ui/core/styles'

import {
  Directions as DirectionsIcon,
  ExpandMore as ExpandMoreIcon,
} from "@material-ui/icons"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      width: 400,
    },
    panelSummaryContent: {
      width: '100%',
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1,
    },
    iconButton: {
      padding: 10,
    },
    divider: {
      height: 'auto',
      margin: 4,
    },
    formHelperText: {
      width: '100%',
    }
  }),
)


export type QueryState = {
  html: string,
  sql?: string,
  parserError?: string,
}

export interface Props {
  query: QueryState,
  changeQuery: (sql: string) => void,
  executeQuery: () => void,
  expanded: boolean,
  onExpansionChange: (event: object, expanded: boolean) => void,
}

export default function SqlInput(props: PropsWithChildren<Props>) {
  const classes = useStyles()

  return (
      <Accordion
        expanded={props.expanded}
        onChange={props.onExpansionChange}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-label="Expand"
          aria-controls="additional-actions1-content"
          id="additional-actions1-header"
        >
          <FormControl
            fullWidth
            style={{ flexDirection: "unset" }}
            error={props.query.parserError !== undefined}
            onFocus={ (event: SyntheticEvent) => { event.stopPropagation() }}
            onClick={ (event: SyntheticEvent) => { event.stopPropagation() }}
          >
            <TextField
              className={classes.input}
              label="SQL"
              value={props.query.html}
              onChange={(e) => props.changeQuery(e.target.value)}
              error={props.query.parserError !== undefined}
              helperText={props.query.parserError || ""}
              multiline
              variant="outlined"
            />
            <Divider
              className={classes.divider}
              orientation="vertical"
            />
            <IconButton
              type="submit"
              color="primary"
              className={classes.iconButton}
              disabled={props.query.parserError !== undefined}
              onClick={ () => { props.executeQuery() }}
              aria-label="directions">
              <DirectionsIcon />
            </IconButton>
          </FormControl>
        </AccordionSummary>
        <AccordionDetails>
          {props.children}
        </AccordionDetails>
      </Accordion>
  )
}

import React from 'react'
import {List} from "immutable"
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles'
import {
  ExpansionPanelSummary, 
  ExpansionPanelDetails,
  ExpansionPanel,
  Typography,
  List as ListContainer,
  Box,
} from '@material-ui/core'
import {ExpandMore} from '@material-ui/icons'


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
  }),
)

export type LogMessage = {
  date: string,
  msg: string,
}

export interface Props {
  title: string,
  messages: List<LogMessage>,
}

export function Log(props: Props) {
  const classes = useStyles()

  return (
    <div className={classes.root}>
      <ListContainer>
        {props.messages.map((m, i) => (
          <Typography key={i}>
            <Box display="flex">
              <Box fontFamily="Monospace" fontWeight="fontWeightMedium">{m.date}</Box>
              <Box fontFamily="Monospace" fontWeight="fontWeightMedium">{m.msg}</Box>
            </Box>
          </Typography>
        ))}
      </ListContainer>
    </div>
  )
}



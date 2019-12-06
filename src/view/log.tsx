import React, {useRef, useEffect} from 'react'
import {List} from "immutable"
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles'
import {
  ExpansionPanelSummary, 
  ExpansionPanelDetails,
  ExpansionPanel,
  Typography,
  List as ListContainer,
  ListItem,
  Box,
} from '@material-ui/core'
import {ExpandMore} from '@material-ui/icons'


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      overflow: "auto",
      maxHeight: 200,
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
    container: {
    },
  }),
)

export type LogMessage = {
  date: string,
  msg: string,
  error: boolean,
}

function LogEntry(props: {message: LogMessage}) {
  return ( 
    <ListItem>
      <Typography color={props.message.error ? "error" : "primary"}>
        <Box display="flex">
          <Box fontFamily="Monospace" fontWeight="fontWeightMedium">{props.message.date}</Box>
          <Box fontFamily="Monospace" fontWeight="fontWeightMedium">{props.message.msg}</Box>
        </Box>
      </Typography>
    </ListItem>
  )
}

export interface Props {
  title: string,
  messages: List<LogMessage>,
}

export function Log(props: Props) {
  const classes = useStyles()
  const logEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => logEndRef.current!.scrollIntoView({ block: "end", inline: "nearest", behavior: "smooth" })

  useEffect(scrollToBottom, [props.messages])

  return (
    <Box component="div" className={classes.root}>
      <ListContainer className={classes.container}>
        {props.messages.map((m, i) => <LogEntry key={i} message={m} />)}
        <ListItem component="div" ref={logEndRef} />
      </ListContainer>
    </Box>
  )
}



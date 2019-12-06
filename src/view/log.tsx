import React, {useRef, useEffect} from 'react'
import {List} from "immutable"
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles'
import {
  List as ListContainer,
  ListItem,
  Box,
} from '@material-ui/core'

export type LogMessage = {
  date: string,
  msg: string,
  error: boolean,
}

const useEntryStyles = makeStyles((theme: Theme) =>
  createStyles({
    item: {
      padding: theme.spacing(0.5),
    },
  }),
)

function LogEntry(props: {message: LogMessage}) {
  const classes = useEntryStyles()
  return ( 
    <ListItem className={classes.item}>
      <Box display="flex">
        <Box fontFamily="Monospace" fontWeight="fontWeightMedium" color={props.message.error ? "text.error" : "text.primary"}>{props.message.date}</Box>
        <Box fontFamily="Monospace" fontWeight="fontWeightMedium" color={props.message.error ? "text.error" : "text.primary"}>{props.message.msg}</Box>
      </Box>
    </ListItem>
  )
}

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
  }),
)

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
      <ListContainer>
        {props.messages.map((m, i) => <LogEntry key={i} message={m} />)}
        <ListItem component="div" ref={logEndRef} />
      </ListContainer>
    </Box>
  )
}



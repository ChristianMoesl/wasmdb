import React, {
  PropsWithChildren,
  Component,
  SyntheticEvent,
  ChangeEvent,
  KeyboardEvent,
} from "react"

import deepEqual from 'fast-deep-equal'

import {
  FormControl,
  FormHelperText,
  InputLabel,
  Input,
  IconButton,
  Divider,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Box,
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


// no operation
const noop = () => null

/**
 * @function
 * @description
 * @param  {DOMElement} container The container in which the cursor position must be saved
 * @return {Function}             A function used to restore caret position
 */
function selectionSaveCaretPosition(container: any) {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0) {
    return noop
  }

  const range = selection.getRangeAt(0)
  const clone = range.cloneRange()

  // find the range start index
  clone.selectNodeContents(container)
  clone.setStart(container, 0)
  clone.setEnd(range.startContainer, range.startOffset)
  let startIndex = clone.toString().length

  // find the range end index
  clone.selectNodeContents(container)
  clone.setStart(container, 0)
  clone.setEnd(range.endContainer, range.endOffset)
  const endIndex = clone.toString().length

  return function restoreCaretPosition() {
    const start = getTextNodeAtPosition(container, startIndex)
    const end = getTextNodeAtPosition(container, endIndex)
    const newRange = new Range()

    newRange.setStart(start.node, start.position)
    newRange.setEnd(end.node, end.position)

    selection.removeAllRanges()
    selection.addRange(newRange)
    container.focus()

  }
}

/**
 * @function
 * @description This function is used to determine the text node and it's index within
 * a "root" DOM element.
 *
 * @param  {DOMElement} rootEl The root
 * @param  {Integer} index     The index within the root element of which you want to find the text node
 * @return {Object}            An object that contains the text node, and the index within that text node
 */
function getTextNodeAtPosition(rootEl: any, index: any) {
  //@ts-ignore
  const treeWalker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, function next(elem) {
    if (index > elem.textContent.length) {
      index -= elem.textContent.length
      return NodeFilter.FILTER_REJECT
    }
    return NodeFilter.FILTER_ACCEPT
  })
  const node = treeWalker.nextNode()

  return {
    node: node ? node : rootEl,
    position: node ? index : 0,
  }
}

function normalizeHtml(str: string): string {
  return str && str.replace(/&nbsp|\u202F|\u00A0/g, ' ')
}

function htmlToText(html: string) {
  return html.replace(/&nbsp;/g, ' ')
    .replace(/<div>([^<]*)<\/div>/g, '$1\n')
    .replace(/<[^>]*>/g, '')
}

interface EditableProps {
  value: string,
  inputRef: (ref: HTMLInputElement | null) => void,
  disabled?: boolean,
  tagName?: string,
  className?: string,
  style?: Object,
  changeQuery: (query: string) => void,
  executeQuery: () => void,
}


class ContentEditable extends Component<EditableProps> {
  el: any = typeof this.props.inputRef === 'function' ? {current: null} : React.createRef<HTMLElement>()

  getEl = () => (this.props.inputRef && typeof this.props.inputRef !== 'function' ? this.props.inputRef : this.el).current

  constructor(props: EditableProps) {
    super(props)
  }

  handleInput(event: ChangeEvent<HTMLInputElement>) {
    const sql = htmlToText(event.target.innerHTML)

    this.props.changeQuery(sql)
  }

  handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      event.preventDefault()

      this.props.executeQuery()
    }
  }

  render() {
    const {tagName, value, inputRef, changeQuery, executeQuery, ...props} = this.props

    return React.createElement(
      tagName || 'div',
      {
        ...props,
        ref: typeof inputRef === 'function' ? (current: HTMLInputElement) => {
          inputRef(current)
          this.el.current = current
        } : inputRef || this.el,
        onInput: (event: ChangeEvent<HTMLInputElement>) => this.handleInput(event),
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => this.handleKeyDown(event),
        contentEditable: true,
        dangerouslySetInnerHTML: {__html: value}
      },
      this.props.children)
  }


  shouldComponentUpdate(nextProps: EditableProps): boolean {
    const {props} = this
    const el = this.getEl()

    // We need not rerender if the change of props simply reflects the user's edits.
    // Rerendering in this case would make the cursor/caret jump

    // Rerender if there is no element yet... (somehow?)
    if (!el) return true

    // Check if the html is updated
    if (el.innerHTML !== nextProps.value) return true

    // Handle additional properties
    return props.disabled !== nextProps.disabled ||
      props.tagName !== nextProps.tagName ||
      props.className !== nextProps.className ||
      props.inputRef !== nextProps.inputRef ||
      !deepEqual(props.style, nextProps.style)
  }

  getSnapshotBeforeUpdate(prevProps: EditableProps) {
    if (!this.getEl()) return noop
    return selectionSaveCaretPosition(this.getEl())
  }

  componentDidUpdate(_: EditableProps, __: EditableProps, restoreSelection: () => void) {
    const el = this.getEl()
    if (!el) return;

    restoreSelection()
  }
}

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
      width: '100%',
      marginTop: 16,
    },
    inputWrapper: {
      display: 'flex',
      width: '100%',
      flexWrap: 'wrap',
    },
    inputLabel: {

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
  sql: string,
  htmlRepresentation: string,
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

    //<Paper className={classes.root}>
    //</Paper>
  return (
      <ExpansionPanel
        expanded={props.expanded}
        onChange={props.onExpansionChange}
      >
        <ExpansionPanelSummary
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
            <Box className={classes.inputWrapper}>
              <InputLabel
                className={classes.inputLabel}
                htmlFor="input-text-field"
              >
                SQL Query
              </InputLabel>
              <Input
                id="input-text-field"
                aria-describedby="helper-text"
                className={classes.input}
                value={props.query.htmlRepresentation}
                inputComponent={ContentEditable as any}
                inputProps={{
                  changeQuery: props.changeQuery,
                  executeQuery: props.executeQuery,
                  fullwidth: "true",
                }}
              />
              <FormHelperText 
                id="helper-text"
                className={classes.formHelperText}>
                {props.query.parserError || ""}
              </FormHelperText>
            </Box>
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
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          {props.children}
        </ExpansionPanelDetails>
      </ExpansionPanel>
  )
}

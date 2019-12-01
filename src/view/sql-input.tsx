import React, {
  PropsWithChildren,
  Component,
  useRef,
  useState,
} from "react"

import deepEqual from 'fast-deep-equal'
import * as PropTypes from 'prop-types'

import {
  Paper,
  Button,
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
import {hideLog} from "../store"


// no operation
const noop = () => null

/**
 * @function
 * @description
 * @param  {DOMElement} container The container in which the cursor position must be saved
 * @return {Function}             A function used to restore caret position
 */
//@ts-ignore
function selectionSaveCaretPosition(container) {
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
//@ts-ignore
function getTextNodeAtPosition(rootEl, index) {
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

type ContentEditableEvent = React.SyntheticEvent<any, Event> & {target: {value: string}}
type Modify<T, R> = Pick<T, Exclude<keyof T, keyof R>> & R
type DivProps = Modify<JSX.IntrinsicElements["div"], {onChange: ((event: ContentEditableEvent) => void)}>


interface EditableProps {
  value: string,
  inputRef: (ref: HTMLInputElement | null) => void,
  disabled?: boolean,
  tagName?: string,
  className?: string,
  style?: Object,
  changeQuery: (query: string) => void,
}


class ContentEditable extends Component<EditableProps> {
  el: any = typeof this.props.inputRef === 'function' ? {current: null} : React.createRef<HTMLElement>()

  getEl = () => (this.props.inputRef && typeof this.props.inputRef !== 'function' ? this.props.inputRef : this.el).current

  constructor(props: EditableProps) {
    super(props)
  }


  //useEffect(() => {
  //setLabelWidth(labelRef.current!.offsetWidth)
  //}, [])


  handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    const sql = htmlToText(event.target.innerHTML)

    this.props.changeQuery(sql)
  }

  render() {
    const {tagName, value, inputRef, changeQuery, ...props} = this.props
    return React.createElement(
      tagName || 'div',
      {
        ...props,
        ref: typeof inputRef === 'function' ? (current: HTMLInputElement) => {
          inputRef(current)
          this.el.current = current
        } : inputRef || this.el,
        onInput: (event: any) => { this.handleInput(event) },
        onClick: (event: any) => { event.stopPropagation() },
        onFocus: (event: any) => { event.stopPropagation() },
        //onChange: this.handleInput,
        //onBlur: this.props.onBlur || this.handleInput,
        //onKeyUp: this.props.onKeyUp || this.handleInput,
        //onKeyDown: this.props.onKeyDown || this.handleInput,
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

  getSnapshotBeforeUpdate(prevProps: any) {
    if (!this.getEl()) return noop
    return selectionSaveCaretPosition(this.getEl())
  }

  componentDidUpdate(prevProps: any, __: any, restoreSelection: () => void) {
    const el = this.getEl()
    if (!el) return;

    restoreSelection()
  }

  //emitChange = (originalEvt: React.SyntheticEvent<any>) => {
    //const el = this.getEl()
    //if (!el) return

    ////const html = el.innerHTML
    ////if (this.props.onChange && html !== this.lastHtml) {
    ////// Clone event with Object.assign to avoid
    ////// "Cannot assign to read only property 'target' of object"
    ////const evt = Object.assign({}, originalEvt, {
    ////target: {
    ////value: html
    ////}
    ////})
    ////this.props.onChange(evt)
    ////}
    ////this.lastHtml = html
  //}

  static propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    changeQuery: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    tagName: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    inputRef: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.func,
    ])
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
  const [labelWidth, setLabelWidth] = useState(0)
  const [syntaxError, setSyntaxError] = useState("")
  const labelRef = useRef<HTMLLabelElement>(null)
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
            onClick={ (event: any) => { event.stopPropagation() }}
            onFocus={ (event: any) => { event.stopPropagation() }}
          >
            <Box className={classes.inputWrapper}>
              <Input
                id="input-text-field"
                className={classes.input}
                value={props.query.htmlRepresentation}
                inputComponent={ContentEditable as any}
                inputProps={{
                  changeQuery: props.changeQuery,
                  fullwidth: "true",
                }}
              />
              <InputLabel
                className={classes.inputLabel}
                htmlFor="input-text-field"
              >
                SQL Query
              </InputLabel>
              <FormHelperText className={classes.formHelperText}>
                {props.query.parserError || ""}
              </FormHelperText>
            </Box>
            <Divider 
              className={classes.divider} 
              orientation="vertical" 
              onClick={ (event: any) => { event.stopPropagation() }}
              onFocus={ (event: any) => { event.stopPropagation() }}
            />
            <IconButton 
              type="submit" 
              color="primary" 
              className={classes.iconButton} 
              disabled={props.query.parserError !== undefined}
              onSubmit={ () => { props.executeQuery() } }
              onClick={ (event: any) => { 
                props.executeQuery()
                event.stopPropagation() 
              }}
              onFocus={ (event: any) => { event.stopPropagation() }}
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
      //<Button variant="contained"
        //color="primary"
        //disabled={props.query.parserError !== undefined}
        //onClick={() => {props.executeQuery()}}  >
        //Process
        //</Button>
        //<InputLabel ref={labelRef} htmlFor="component-outlined">
          //Name
        //<3/InputLabel>

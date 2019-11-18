import React, {Component, createRef, useRef, useState, useEffect, RefObject} from "react"
import {connect} from "react-redux"
import {withRouter} from "react-router-dom"
import {VariableSizeList} from "react-window"
import deepEqual from 'fast-deep-equal';
import * as PropTypes from 'prop-types';
import {Button, Box, Container, Grid, Typography, TextField, FormControl, FormControlLabel, FormHelperText, InputLabel, OutlinedInput} from "@material-ui/core"
import {makeStyles, useTheme, Theme, createStyles, ThemeProvider} from '@material-ui/core/styles'

import {State as StoreState, changeQuery, htmlToText, appendLog, resetLogUpdated, EngineStatus, executeQuery} from "../store"


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
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return noop;
  }

  const range = selection.getRangeAt(0);
  const clone = range.cloneRange();

  // find the range start index
  clone.selectNodeContents(container);
  clone.setStart(container, 0);
  clone.setEnd(range.startContainer, range.startOffset);
  let startIndex = clone.toString().length;

  // find the range end index
  clone.selectNodeContents(container);
  clone.setStart(container, 0);
  clone.setEnd(range.endContainer, range.endOffset);
  const endIndex = clone.toString().length;

  return function restoreCaretPosition() {
    const start = getTextNodeAtPosition(container, startIndex);
    const end = getTextNodeAtPosition(container, endIndex);
    const newRange = new Range();

    newRange.setStart(start.node, start.position);
    newRange.setEnd(end.node, end.position);

    selection.removeAllRanges();
    selection.addRange(newRange);
    container.focus();

  };
};

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
      index -= elem.textContent.length;
      return NodeFilter.FILTER_REJECT;
    }
    return NodeFilter.FILTER_ACCEPT;
  });
  const node = treeWalker.nextNode();

  return {
    node: node ? node : rootEl,
    position: node ? index : 0,
  };
};

function normalizeHtml(str: string): string {
  return str && str.replace(/&nbsp;|\u202F|\u00A0/g, ' ');
}

function findLastTextNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node;
  let children = node.childNodes;
  for (let i = children.length - 1; i >= 0; i--) {
    let textNode = findLastTextNode(children[i]);
    if (textNode !== null) return textNode;
  }
  return null;
}

function replaceCaret(el: HTMLElement) {
  // Place the caret at the end of the element
  const target = findLastTextNode(el);
  // do not move caret if element was not focused
  const isTargetFocused = document.activeElement === el;
  if (target !== null && target.nodeValue !== null && isTargetFocused) {
    var sel = window.getSelection();
    if (sel !== null) {
      var range = document.createRange();
      range.setStart(target, target.nodeValue.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (el instanceof HTMLElement) el.focus();
  }
}

/**
 * A simple component for an html element with editable contents.
 */
class ContentEditable extends Component<Props> {
  el: any = typeof this.props.inputRef === 'function' ? {current: null} : React.createRef<HTMLElement>();

  getEl = () => (this.props.inputRef && typeof this.props.inputRef !== 'function' ? this.props.inputRef : this.el).current;


  //useEffect(() => {
  //setLabelWidth(labelRef.current!.offsetWidth)
  //}, [])


  handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    const sql = htmlToText(event.target.innerHTML)
    this.props.changeQuery(sql)
  }

  render() {
    const {tagName, value, inputRef, changeQuery, ...props} = this.props;
    return React.createElement(
      tagName || 'div',
      {
        ...props,
        ref: typeof inputRef === 'function' ? (current: HTMLInputElement) => {
            inputRef(current)
            this.el.current = current
          } : inputRef || this.el,
          onInput: (event: any) => this.handleInput(event),
          //onChange: this.handleInput,
          //onBlur: this.props.onBlur || this.handleInput,
          //onKeyUp: this.props.onKeyUp || this.handleInput,
          //onKeyDown: this.props.onKeyDown || this.handleInput,
          contentEditable: true,
          dangerouslySetInnerHTML: {__html: value}
        },
        this.props.children);
    }


    shouldComponentUpdate(nextProps: Props): boolean {
      const {props} = this;
      const el = this.getEl();

      // We need not rerender if the change of props simply reflects the user's edits.
      // Rerendering in this case would make the cursor/caret jump

      // Rerender if there is no element yet... (somehow?)
      if (!el) return true;

      // Check if the html is updated
      if (el.innerHTML !== nextProps.value) return true

      // Handle additional properties
      return props.disabled !== nextProps.disabled ||
        props.tagName !== nextProps.tagName ||
        props.className !== nextProps.className ||
        props.inputRef !== nextProps.inputRef ||
        !deepEqual(props.style, nextProps.style);
    }

    getSnapshotBeforeUpdate(prevProps: any) {
      if (!this.getEl()) return noop
      return selectionSaveCaretPosition(this.getEl())
    }

    componentDidUpdate(prevProps: any, __: any, restoreSelection: () => void) {
      const el = this.getEl();
      if (!el) return;

      restoreSelection()
  }

  emitChange = (originalEvt: React.SyntheticEvent<any>) => {
    const el = this.getEl();
    if (!el) return;

    //const html = el.innerHTML;
    //if (this.props.onChange && html !== this.lastHtml) {
      //// Clone event with Object.assign to avoid
      //// "Cannot assign to read only property 'target' of object"
      //const evt = Object.assign({}, originalEvt, {
        //target: {
          //value: html
        //}
      //});
      //this.props.onChange(evt);
    //}
    //this.lastHtml = html;
  }

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

type ContentEditableEvent = React.SyntheticEvent<any, Event> & {target: {value: string}};
type Modify<T, R> = Pick<T, Exclude<keyof T, keyof R>> & R;
type DivProps = Modify<JSX.IntrinsicElements["div"], {onChange: ((event: ContentEditableEvent) => void)}>;

export interface Props extends DivProps {
  value: string,
  onChange: (event: {target: {value: string}}) => void
  disabled?: boolean,
  tagName?: string,
  className?: string,
  style?: Object,
  inputRef?: React.RefObject<HTMLElement> | Function,
  changeQuery: (query: string, error?: string) => void,
}



type ToolProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

//     <TextField
//         label="SQL Query"
//         variant="outlined"
//         id="custom-css-outlined-input"
//         multiline
//         error={sqlInputError !== ""}
//         helperText={sqlInputError}
//         fullWidth
//         onChange={ (e: any) => props.changeQuery(e.target.value) }
//       />
function SqlInput(props: ToolProps) {
  const [labelWidth, setLabelWidth] = useState(0)
  const [syntaxError, setSyntaxError] = useState("")
  const labelRef = useRef<HTMLLabelElement>(null)

  return (
    <div style={{width: "100%"}}>
      <FormControl variant="outlined">
        <InputLabel ref={labelRef} htmlFor="component-outlined">
          Name
          </InputLabel>
        <OutlinedInput
          id="component-outlined"
          labelWidth={labelWidth}
          value={props.queryHtml}
          fullWidth
          error={props.queryError !== undefined}
          inputComponent={ContentEditable as any}
          inputProps={{
            changeQuery: props.changeQuery,
            fullwidth: "true",
          }}
        />
        {props.queryError &&
        <FormHelperText>
          {props.queryError}
        </FormHelperText>
        }
      </FormControl>
      <div>
      </div>
      <Button variant="contained"
        color="primary"
        disabled={props.queryError !== undefined}
        onClick={(e: any) => { props.executeQuery() }}  >
        Process
        </Button>
    </div>
  )
}

function mapStateToProps(state: {store: StoreState}) {
  return {
    query: state.store.query,
    queryHtml: state.store.queryHtml,
    queryError: state.store.queryError,
    engineStatus: state.store.engineStatus,
    engineError: state.store.engineError
  }
}

function mapDispatchToProps(dispatch: React.Dispatch<any>) {
  return {
    changeQuery: (query: string) => dispatch(changeQuery(query)),
    executeQuery: () => dispatch(executeQuery()),
  }
}

// @ts-ignore
export default withRouter(connect(
  mapStateToProps,
  mapDispatchToProps
)(SqlInput));

import {List, Map} from "immutable"
import promiseMiddleware from "redux-promise-middleware"
import {composeWithDevTools} from "redux-devtools-extension"
import thunkMiddleware from "redux-thunk"
import {Dispatch} from "react"
import {batch} from "react-redux"

import {
  createStore,
  applyMiddleware,
  Action,
} from "redux";

import {parse} from "./util/sql-parser"
import {saveBlob} from "./util/blob-save"
import {QueryState} from "./view/sql-input"
import {createWasmWorker, FilePreview, EngineStatus} from "./wasm/master"
export {FilePreview} from "./wasm/master"


const demoFilePreviews: Array<FilePreview> = [{
  name: "t1gram.csv",
  contentPreview: ["Aurung,1959,11,9", "Aurung,1960,7,7", "Aurung,1961,6,4"],
  size: 1024,
  type: "text/csv"
}, {
  name: "t1gram.csv",
  contentPreview: ["Aurung,1959,11,9", "Aurung,1960,7,7", "Aurung,1961,6,4"],
  size: 1024,
  type: "text/csv"
}, {
  name: "t1gram.csv",
  contentPreview: ["Aurung,1959,11,9", "Aurung,1960,7,7", "Aurung,1961,6,4"],
  size: 1024,
  type: "text/csv"
}]

function createConnectedWorker() {
  return createWasmWorker(
    (msg: string) => store.dispatch(<any>appendLog(msg)),
    (result: List<string>) => store.dispatch(<any>printResult(result))
  )
}

let worker = createConnectedWorker()

export type State = typeof initialState

export const initialState = ({
  query: {
    sql: "",
    htmlRepresentation: "",
    parserError: undefined as (undefined | string),
  } as QueryState,
  notifications: List<string>(),
  filePreviews: List<FilePreview>(),
  logMessages: List<{date: string, msg: string}>(),
  logUpdated: false,
  resultFragments: List<string>(),
  engineStatus: "idle" as EngineStatus,
  engineError: null as (null | string),
})

// Actions
export type AppendLogAction = {type: "APPEND_LOG", error: false, payload: {date: string, msg: string}}
export function appendLog(msg: string) {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return {
    type: "APPEND_LOG",
    error: false,
    payload: {
      date: "[" + hours + ":" + minutes + ":" + seconds + ":" + milliseconds + "]",
      msg
    }
  }
}

type ExecuteQueryAction =
  {type: "EXECUTE_QUERY_PENDING"} |
  {type: "EXECUTE_QUERY_FULFILLED", payload: {}} |
  {type: "EXECUTE_QUERY_REJECTED", error: true, payload: string}

export const executeQuery = () =>
  (dispatch: Dispatch<object>, getState: () => State) => {
    dispatch({
      type: "EXECUTE_QUERY",
      payload() {return worker("executeQuery", getState().query)}
    })
  }

export type ResetLogUpdatedAction = {type: "RESET_LOG_UPDATED"}
export function resetLogUpdated() {return {type: "RESET_LOG_UPDATED"}}

type AbortExecutionAction = {type: "ABORT_EXECUTION"}
export const abortExecution: () => AbortExecutionAction = () => {
  worker("abortExecution")
  worker = createConnectedWorker()
  return {
    type: "ABORT_EXECUTION"
  }
}


function textToHtml(text: string) {
  return text.replace(/ /g, '&nbsp;')
    .replace(/(.*)\n/g, '<div>$1</div>')
}

function stripWhitespaces(text: string) {
  const startMatcher = text.match(/^(\s+)\S.*/)
  const start = startMatcher ? startMatcher[1] : ""

  const endMatcher = text.match(/.*\S(\s+)$/)
  const end = endMatcher ? endMatcher[1] : ""

  const stripped = text.substring(start.length, text.length - end.length)

  return [start, stripped, end]
}

export type ChangeQueryAction =
  {type: "CHANGE_QUERY_PENDING"} |
  {type: "CHANGE_QUERY_FULFILLED", payload: QueryState} |
  {type: "CHANGE_QUERY_REJECTED", error: true, payload: QueryState}

export const changeQuery = (query: string) => ({
  type: "CHANGE_QUERY",
  payload: new Promise((resolve, reject) => {
    const parts = stripWhitespaces(query)

    try {
      const colored = parse(parts[1])

      resolve({
        sql: query,
        htmlRepresentation: textToHtml(parts[0] + colored + parts[2]) + "<br>",
        parserError: undefined,
      })
    } catch (e) {
      reject({
        sql: query,
        htmlRepresentation: textToHtml(query) + "<br>",
        parserError: (e as SyntaxError).message,
      })
    }
  })
})


export type PrintResultAction = {type: "PRINT_RESULT", result: List<string>};
export function printResult(result: List<string>) {return {type: "PRINT_RESULT", result}}

export type NotificationAction = {type: "NOTIFICATION", payload: string}
export const notify = (msg: string) => ({type: "NOTIFICATION", payload: msg})

type LoadFilesAction =
  {type: "LOAD_FILES_PENDING"} |
  {type: "LOAD_FILES_FULFILLED", payload: Array<FilePreview>} |
  {type: "LOAD_FILES_REJECTED", error: true, payload: string}

export const loadFiles = (fileHandles: FileList) =>
  (dispatch: Dispatch<object>, state: () => State) => {
    let canNotLoad = new Array<string>()
    let canLoad = new Array<File>()

    for (let i = 0; i < fileHandles.length; i++) {
      const name = fileHandles[i].name

      if (!state().filePreviews.every(f => f.name !== name))
        canNotLoad.push(name)
      else
        canLoad.push(fileHandles[i])
    }

    if (canNotLoad.length > 0)
      dispatch(notify(`file${canNotLoad.length > 1 ? "s" : ""}: ${canNotLoad} already loaded`))

    dispatch({
      type: "LOAD_FILES",
      async payload() {return worker("loadFiles", fileHandles)}
    })
  }


type RemoveFileAction = {type: "REMOVE_FILE", fileName: string}
export const removeFile: (fileName: string) => RemoveFileAction
  = fileName => ({type: "REMOVE_FILE", fileName})


type SaveFileAction =
  {type: "SAVE_FILE_PENDING"} |
  {type: "SAVE_FILE_FULFILLED", payload: string} |
  {type: "SAVE_FILE_REJECTED", error: true, payload: string}

export const saveFile = (fileName: string) =>
  (dispatch: Dispatch<object>, state: () => State) => {
    dispatch({
      type: "SAVE_FILE",
      async payload() {
        const blob = new Blob(state().resultFragments.toJS())
        return saveBlob(fileName, blob)
      }
    })
  }


type EngineErrorAction = {type: "ENGINE_ERROR", msg: string}
export const engineError: (msg: string) => EngineErrorAction
  = msg => ({type: "ENGINE_ERROR", msg})

type PossibleAction = PrintResultAction
  | AppendLogAction
  | ChangeQueryAction
  | ExecuteQueryAction
  | ResetLogUpdatedAction
  | NotificationAction
  | LoadFilesAction
  | RemoveFileAction
  | SaveFileAction
  | EngineErrorAction

// Reducer
export function reducer(state = initialState, action: PossibleAction): State {
  switch (action.type) {
    case "CHANGE_QUERY_PENDING": return state
    case "CHANGE_QUERY_FULFILLED":
    case "CHANGE_QUERY_REJECTED": return {
      ...state,
      query: action.payload,
    }
    case "EXECUTE_QUERY_PENDING":
      return {
        ...state,
        resultFragments: List(),
        engineStatus: "executing"
      }
    case "EXECUTE_QUERY_FULFILLED": return {
      ...state,
      engineStatus: "idle",
      engineError: null
    }
    case "EXECUTE_QUERY_REJECTED": return {
      ...state,
      engineStatus: "idle",
      engineError: action.payload
    }
    case "NOTIFICATION": return {
      ...state,
      notifications: state.notifications.push(action.payload)
    }
    case "LOAD_FILES_PENDING": return {
      ...state,
      engineStatus: "fileLoading"
    }
    case "LOAD_FILES_FULFILLED": return {
      ...state,
      filePreviews: state.filePreviews.concat(List(action.payload))
    }
    case "LOAD_FILES_REJECTED": return {
      ...state,
      engineError: action.payload
    }
    case "REMOVE_FILE": return {
      ...state,
      filePreviews: state.filePreviews.filter(file => file.name != action.fileName)
    }
    case "SAVE_FILE_PENDING": return {
      ...state,
      engineStatus: "savingFile"
    }
    case "SAVE_FILE_FULFILLED": return {
      ...state,
      engineStatus: "idle",
      engineError: null
    }
    case "SAVE_FILE_REJECTED": return {
      ...state,
      engineStatus: "idle",
      engineError: action.payload
    }
    case "APPEND_LOG": return {
      ...state,
      logMessages: state.logMessages.push(action.payload),
      logUpdated: true
    }
    case "RESET_LOG_UPDATED": return {
      ...state,
      logUpdated: false
    }
    case "PRINT_RESULT": return {
      ...state,
      resultFragments: state.resultFragments.concat(action.result)
    }
    case "ENGINE_ERROR": return {
      ...state,
      engineStatus: "idle", engineError: action.msg
    }
    default: return state;
  }
};

const middleware = applyMiddleware(thunkMiddleware, promiseMiddleware)

// Store
export const store = createStore(reducer, composeWithDevTools({})(middleware))

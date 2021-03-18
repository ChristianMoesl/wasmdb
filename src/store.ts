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

import {QueryState} from "./view/sql-input"
import {LogMessage} from "./view/log"
import {createWasmWorker, FilePreview, EngineStatus} from "./wasm/master"
export {FilePreview} from "./wasm/master"
import {parse, SyntaxError} from "./parser/sql-parser"


function createConnectedWorker() {
  return createWasmWorker(
    (msg: string) => store.dispatch(appendLog(msg) as any),
    (result: List<string>) => store.dispatch(printResult(result) as any)
  )
}

let worker = createConnectedWorker()

export type Result = {
  csvHeader: string,
  csvData: List<string>,
}

export type State = typeof initialState

export const initialState = ({
  query: {
    html: "",
    sql: undefined as (undefined | string),
    parserError: undefined as (undefined | string),
  } as QueryState,
  notifications: List<string>(),
  filePreviews: List<FilePreview>(),
  logDisplayed: false,
  logMessages: List<LogMessage>(),
  result: undefined as (Result | undefined),
  downloadUrl: undefined as (undefined | string),
  engineStatus: "idle" as EngineStatus,
  engineError: null as (null | string),
})

// Actions
export type AppendLogAction = {type: "APPEND_LOG", payload: {date: string, msg: string, error: boolean}}
export function appendLog(msg: string, error = false) {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return {
    type: "APPEND_LOG",
    payload: {
      date: "[" + hours + ":" + minutes + ":" + seconds + ":" + milliseconds + "]",
      msg,
      error,
    }
  }
}

export type ShowLogAction = {type: "SHOW_LOG", payload: {}}
export type HideLogAction = {type: "HIDE_LOG", payload: {}}

export const showLog = () => ({type: "SHOW_LOG", payload: {}})
export const hideLog = () => ({type: "HIDE_LOG", payload: {}})

type ExecuteQueryAction =
  {type: "EXECUTE_QUERY_PENDING"} |
  {type: "EXECUTE_QUERY_FULFILLED", payload: {}}

export const executeQuery = () =>
  (dispatch: Dispatch<object>, getState: () => State) => {
    dispatch({
      type: "EXECUTE_QUERY",
      payload: worker("executeQuery", getState().query.sql).catch((error: any) => {
        dispatch(appendLog(error, true))
      })
    })
  }

type AbortExecutionAction = {type: "ABORT_EXECUTION"}
export const abortExecution: () => AbortExecutionAction = () => {
  worker("abortExecution")
  worker = createConnectedWorker()
  return {
    type: "ABORT_EXECUTION"
  }
}

export type ParseQueryAction =
  {type: "PARSE_QUERY_FULFILLED", payload: string} |
  {type: "PARSE_QUERY_REJECTED", error: true, payload: string}

export const parseQuery = (text: string) =>
  (dispatch: Dispatch<object>, state: () => State) => {
    dispatch({
      type: "PARSE_QUERY",
      async payload() {
        return new Promise((resolve, reject) => {
          try {
            resolve(parse(state().query.html))
          } catch (e) {
            reject((e as SyntaxError).message)
          }
        })
      }
    })
  }

export type ChangeQueryAction =
  {type: "CHANGE_QUERY", payload: string}

export const changeQuery = (html: string) =>
  (dispatch: any, getState: () => State) => {
    dispatch({
      type: "CHANGE_QUERY",
      payload: html
    })

    dispatch({
      type: "PARSE_QUERY",
      async payload() {
        return new Promise((resolve, reject) => {
          try {
            resolve(parse(html))
          } catch (e) {
            reject((e as SyntaxError).message)
          }
        })
      }
      // tslint:disable-next-line:no-empty
    }).catch(() => {})
  }

export type PrintResultAction = {type: "PRINT_RESULT", result: List<string>};
export function printResult(result: List<string>) {return {type: "PRINT_RESULT", result}}

export type NotificationAction = {type: "NOTIFICATION", payload: string}
export const notify = (msg: string) => ({type: "NOTIFICATION", payload: msg})

type LoadFilesAction =
  {type: "LOAD_FILES_PENDING"} |
  {type: "LOAD_FILES_FULFILLED", payload: FilePreview[]} |
  {type: "LOAD_FILES_REJECTED", error: true, payload: string}

export const loadFiles = (fileHandles: FileList) =>
  (dispatch: Dispatch<object>, state: () => State) => {
    const canNotLoad = new Array<string>()
    const canLoad = new Array<File>()

    // tslint:disable-next-line:prefer-for-of
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


type EngineErrorAction = {type: "ENGINE_ERROR", msg: string}
export const engineError: (msg: string) => EngineErrorAction
  = msg => ({type: "ENGINE_ERROR", msg})

type PossibleAction = PrintResultAction
  | AppendLogAction
  | ShowLogAction
  | HideLogAction
  | ChangeQueryAction
  | ParseQueryAction
  | ExecuteQueryAction
  | NotificationAction
  | LoadFilesAction
  | RemoveFileAction
  | EngineErrorAction

// Reducer
export function reducer(state = initialState, action: PossibleAction): State {
  switch (action.type) {
    case "SHOW_LOG": return {
      ...state,
      logDisplayed: true,
    }
    case "HIDE_LOG": return {
      ...state,
      logDisplayed: false,
    }
    case "CHANGE_QUERY": return {
      ...state,
      query: {
        ...state.query,
        html: action.payload,
      }
    }
    case "PARSE_QUERY_FULFILLED": return {
      ...state,
      query: {
        ...state.query,
        sql: action.payload,
        parserError: undefined,
      }
    }
    case "PARSE_QUERY_REJECTED": return {
      ...state,
      query: {
        ...state.query,
        sql: undefined,
        parserError: action.payload
      }
    }
    case "EXECUTE_QUERY_PENDING":
      if (state.downloadUrl)
        URL.revokeObjectURL(state.downloadUrl)

      return {
        ...state,
        result: undefined,
        engineStatus: "executing",
        downloadUrl: undefined
      }
    case "EXECUTE_QUERY_FULFILLED":
      const header = List([state.result!.csvHeader])
      const lines = header.concat(state.result!.csvData)
      const text = lines.map(line => line + "\n").toJS()

      const blob = new Blob(text, {type: "text/csv"})

      const downloadUrl = URL.createObjectURL(blob)

      return {
        ...state,
        engineStatus: "idle",
        engineError: null,
        downloadUrl
      }
    case "NOTIFICATION": return {
      ...state,
      notifications: state.notifications.push(action.payload)
    }
    case "LOAD_FILES_PENDING": return {
      ...state,
      engineStatus: "fileLoading"
    }
    case "LOAD_FILES_FULFILLED":
      return {
        ...state,
        filePreviews: state.filePreviews.concat(List(action.payload))
      }
    case "LOAD_FILES_REJECTED": return {
      ...state,
      engineError: action.payload
    }
    case "REMOVE_FILE": return {
      ...state,
      filePreviews: state.filePreviews.filter(file => file.name !== action.fileName)
    }
    case "APPEND_LOG": return {
      ...state,
      logMessages: state.logMessages.push(action.payload),
      logDisplayed: true
    }
    case "PRINT_RESULT":
      const splitted = action.result.flatMap(fragment => fragment.split("\n"))

      let result
      if (state.result) {
        result = {
          csvHeader: state.result.csvHeader,
          csvData: state.result.csvData.concat(splitted),
        }
      } else if (splitted.size > 0) {
        result = {
          csvHeader: splitted.get(0)!,
          csvData: splitted.skip(1),
        }
      } else {
        result = {
          csvHeader: splitted.get(0)!,
          csvData: List(),
        }
      }

      return {
        ...state,
        result,
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


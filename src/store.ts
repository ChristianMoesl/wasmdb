import {List} from "immutable"
import promiseMiddleware from "redux-promise-middleware"
import {composeWithDevTools} from "redux-devtools-extension"
import thunkMiddleware from "redux-thunk"
import {Dispatch} from "react"
import {batch} from "react-redux"

import {
  WritableStream,
  TransformStream,
  ReadableStream
} from "web-streams-polyfill/ponyfill/es6"

import {
  combineReducers,
  createStore,
  applyMiddleware,
  compose
} from "redux";

import {
  WorkerResponse,
  WorkerRequest,
  CmdError,
  FilePreview
} from "./worker"

import {parse} from "./util/sql-parser"

export {FilePreview} from "./worker"

const work = require('webworkify')
const workerModule = require('./worker')

const streamSaver = require("streamsaver")
streamSaver.WritableStream = WritableStream
streamSaver.TransformStream = TransformStream
streamSaver.mitm = window.location.origin + "/mitm.html"

const commandResolvers = new Map<string, any>()
const commandRejectors = new Map<string, any>()

const storeUpdateFrequency = 5
let nextStoreUpdate = 1
let printedCount = 0

let printedMessages = List<string>()

function handle(response: WorkerResponse) {
  switch (response.type) {
    case "request":
      switch (response.command) {
        case "log":
          console.log(response.payload)
          break
      }
      break
    case "error": rejectResponse(response.answers, response.payload); break
    case "response": resolveResponse(response.answers, response.payload); break
    /*
    default: resolveResponse(response.answers)
    case "filesLoaded": resolveResponse(response.answers, response.files); break
    case "finishedExecution": resolveResponse(response.answers); break
      store.dispatch(printResult(printedMessages))
      resolveResponse(response.answers)
      break
    case "log": store.dispatch(appendLog(response.msg)); break
    case "print":
      printedMessages = printedMessages.push(response.msg)

      if (printedMessages.size + printedCount === nextStoreUpdate) {
        nextStoreUpdate *= storeUpdateFrequency

        store.dispatch(printResult(printedMessages))

        printedCount += printedMessages.size

        printedMessages = List()
      }
      break
    case "error":
      batch(() => {
        store.dispatch(setEngineStatus("idle"))
        store.dispatch(appendLog(response.msg))
      })
      rejectResponse(response)
      break*/
  }
}

function rejectResponse(answers: string, payload: any) {
  commandResolvers.delete(answers)
  const rejector = commandRejectors.get(answers)
  commandRejectors.delete(answers)

  rejector(payload)
}

function resolveResponse(answers: string, payload: any) {
  commandRejectors.delete(answers)
  const resolve = commandResolvers.get(answers)
  commandResolvers.delete(answers)

  resolve(payload)
}

async function sendRequestWithExpectedResponse<T>(command: string, payload: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    worker.postMessage({type: "request", command, payload})
    commandResolvers.set(command, resolve)
    commandRejectors.set(command, reject)
  })
}

let worker: Worker = work(workerModule);
worker.addEventListener('message', (event: any) => handle(<WorkerResponse>event.data));





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





export type State = typeof initialState

const initialState = ({
  query: "",
  queryHtml: "",
  queryError: undefined as (undefined | string),
  filePreviews: demoFilePreviews,// new Array<FilePreview>(),
  logMessages: List<{date: string, msg: string}>(),
  resultFragments: List<string>(),
  logUpdated: false,
  engineStatus: "idle" as EngineStatus,
  engineError: null as (null | string),
})

// Actions
export type AppendLogAction = {type: "APPEND_LOG", msg: {date: string, msg: string}}
export function appendLog(msg: string) {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return {
    type: "APPEND_LOG", msg: {
      date: "[" + hours + ":" + minutes + ":" + seconds + ":" + milliseconds + "]",
      msg
    }
  }
}


export type EngineStatus = "fileLoading" | "savingFile" | "executing" | "idle"
export type SetEngineStatusAction = {type: "SET_ENGINE_STATUS", status: EngineStatus}

type ExecuteQueryAction =
  {type: "EXECUTE_QUERY_PENDING"} |
  {type: "EXECUTE_QUERY_FULFILLED", payload: {}} |
  {type: "EXECUTE_QUERY_REJECTED", error: true, payload: string}

export const executeQuery = () =>
  (dispatch: (e: any) => void, getState: () => State) => {
    dispatch({
      type: "EXECUTE_QUERY",
      payload() {return sendRequestWithExpectedResponse<any>("executeQuery", getState().query)}
    })
  }

export type ResetLogUpdatedAction = {type: "RESET_LOG_UPDATED"}
export function resetLogUpdated() {return {type: "RESET_LOG_UPDATED"}}

type AbortExecutionAction = {type: "ABORT_EXECUTION"}
export const abortExecution: () => AbortExecutionAction = () => {
  worker.terminate()
  worker = work(workerModule)
  return {
    type: "ABORT_EXECUTION"
  }
}

export function htmlToText(html: string) {
  return html.replace(/&nbsp;/g, ' ')
    .replace(/<div>([^<]*)<\/div>/g, '$1\n')
    .replace(/<[^>]*>/g, '')
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
  {type: "CHANGE_QUERY_FULFILLED", payload: {query: string, queryHtml: string}} |
  {type: "CHANGE_QUERY_REJECTED", error: true, payload: {query: string, queryHtml: string, queryError: string}}

export const changeQuery = (query: string) => ({
  type: "CHANGE_QUERY",
  payload: new Promise((resolve, reject) => {
    const parts = stripWhitespaces(query)

    try {
      const colored = parse(parts[1])

      resolve({
        query: query,
        queryHtml: textToHtml(parts[0] + colored + parts[2]) + "<br>",
        queryError: undefined,
      })
    } catch (e) {
      reject({
        query: query,
        queryHtml: textToHtml(query) + "<br>",
        queryError: (e as SyntaxError).message,
      })
    }
  })
})


export type PrintResultAction = {type: "PRINT_RESULT", result: List<string>};
export function printResult(result: List<string>) {return {type: "PRINT_RESULT", result}}

type LoadFilesAction =
  {type: "LOAD_FILES_PENDING"} |
  {type: "LOAD_FILES_FULFILLED", payload: Array<FilePreview>} |
  {type: "LOAD_FILES_REJECTED", error: true, payload: string}

export const loadFiles = (fileHandles: FileList) => {
  return {
    type: "LOAD_FILES",
    async payload() {
      return sendRequestWithExpectedResponse("loadFiles", fileHandles)
    }
  }
}

type RemoveFileAction = {type: "REMOVE_FILE", fileName: string}
export const removeFile: (fileName: string) => RemoveFileAction
  = fileName => ({type: "REMOVE_FILE", fileName})


type SaveFileAction =
  {type: "SAVE_FILE_PENDING"} |
  {type: "SAVE_FILE_FULFILLED", payload: string} |
  {type: "SAVE_FILE_REJECTED", error: true, payload: string}

export const saveFile = (fileName: string) => new Promise((resolve, reject) => {
  const blob = new Blob(store.getState().store.resultFragments.toJS())

  const fileStream = streamSaver.createWriteStream(fileName, {
    size: blob.size // Makes the procentage visiable in the download
  })

  // create a stream from a blob source
  const readableStream = new Response(blob).body!

  // @ts-ignore
  window.writer = fileStream.getWriter()
  const reader = readableStream.getReader()

  function cleanUp(writer: any) {
    writer.close()

    resolve()
  }

  const pump = () => reader.read().then((res: any) =>
    // @ts-ignore
    res.done ? cleanUp(writer) : writer.write(res.value).then(pump))

  pump()
})



type EngineErrorAction = {type: "ENGINE_ERROR", msg: string}
export const engineError: (msg: string) => EngineErrorAction
  = msg => ({type: "ENGINE_ERROR", msg})

type Action = SetEngineStatusAction
  | PrintResultAction
  | ChangeQueryAction
  | ExecuteQueryAction
  | AppendLogAction
  | ResetLogUpdatedAction
  | LoadFilesAction
  | RemoveFileAction
  | SaveFileAction
  | EngineErrorAction

// Reducer
export function reducer(state = initialState, action: Action): State {
  switch (action.type) {
    case "SET_ENGINE_STATUS":
      return (action.status === "executing") ?
        {...state, engineStatus: action.status, resultFragments: List()} : {...state, engineStatus: action.status}
    case "CHANGE_QUERY_PENDING": return state
    case "CHANGE_QUERY_FULFILLED": return {
      ...state,
      query: action.payload.query,
      queryHtml: action.payload.queryHtml,
      queryError: undefined,
    }
    case "CHANGE_QUERY_REJECTED": return {
      ...state,
      query: action.payload.query,
      queryHtml: action.payload.queryHtml,
      queryError: action.payload.queryError,
    }
    case "EXECUTE_QUERY_PENDING":
      printedCount = 0
      printedMessages = List()
      nextStoreUpdate = 1
      return {...state, engineStatus: "executing"}
    case "EXECUTE_QUERY_FULFILLED": return {...state, engineStatus: "idle", engineError: null}
    case "EXECUTE_QUERY_REJECTED": return {...state, engineStatus: "idle", engineError: action.payload}
    case "LOAD_FILES_PENDING": return {...state, engineStatus: "fileLoading"}
    case "LOAD_FILES_FULFILLED": return {...state, filePreviews: state.filePreviews.concat(action.payload)}
    case "LOAD_FILES_REJECTED": return {...state, engineError: action.payload}
    case "REMOVE_FILE": return {...state, filePreviews: state.filePreviews.filter(file => file.name != action.fileName)}
    case "SAVE_FILE_PENDING": return {...state, engineStatus: "savingFile"}
    case "SAVE_FILE_FULFILLED": return {...state, engineStatus: "idle", engineError: null}
    case "SAVE_FILE_REJECTED": return {...state, engineStatus: "idle", engineError: action.payload}
    case "APPEND_LOG": return {...state, logMessages: state.logMessages.push(action.msg), logUpdated: true}
    case "RESET_LOG_UPDATED": return {...state, logUpdated: false}
    case "PRINT_RESULT": return {...state, resultFragments: state.resultFragments.concat(action.result)}
    case "ENGINE_ERROR": return {...state, engineStatus: "idle", engineError: action.msg}
    default: return state;
  }
};

export const reducers = combineReducers({
  store: reducer,
});

const middleware = applyMiddleware(promiseMiddleware, thunkMiddleware)

// Store
export const store = createStore(reducers, composeWithDevTools({})(middleware))

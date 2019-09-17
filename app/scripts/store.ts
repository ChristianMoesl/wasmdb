import { List } from "immutable"

import {
  combineReducers,
  createStore,
} from "redux";

export type State = {
  query: string,
  filesLoaded: Array<File>,
  logMessages: List<{ date: string, msg: string }>,
  resultFragments: List<string>,
  logUpdated: boolean,
  wasmStatus: WasmStatus
}

const initialState: State = ({
  query: "",
  filesLoaded: new Array<File>(),
  logMessages: List<{ date: string, msg: string }>(),
  resultFragments: List<string>(),
  logUpdated: false,
  wasmStatus: "idle"
})

// Actions
export type AppendLogAction = { type: "APPEND_LOG", msg: { date: string, msg: string } }
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

export type WasmStatus = "fileLoading" | "executing" | "idle"
export type SetWasmStatusAction = { type: "SET_WASM_STATUS", status: WasmStatus }
export function setWasmStatus(status: WasmStatus) { return { type: "SET_WASM_STATUS", status } }

export type ResetLogUpdatedAction = { type: "RESET_LOG_UPDATED" }
export function resetLogUpdated() { return { type: "RESET_LOG_UPDATED" } }

export type ChangeQueryAction = { type: "CHANGE_QUERY", query: string }
export function changeQuery(query: string) { return { type: "CHANGE_QUERY", query } }

export type PrintResultAction = { type: "PRINT_RESULT", result: List<string> };
export function printResult(result: List<string>) { return { type: "PRINT_RESULT", result } }

export type UpdateFilesLoadedAction = { type: "UPDATE_FILES_LOADED", filesLoaded: Array<File> }
export function updateFilesLoaded(filesLoaded: Array<File>) { return { type: "UPDATE_FILES_LOADED", filesLoaded }}

type Action = SetWasmStatusAction
            | PrintResultAction
            | ChangeQueryAction
            | AppendLogAction
            | ResetLogUpdatedAction
            | UpdateFilesLoadedAction

// Reducer
export function reducer(state = initialState, action: Action): State {
  switch (action.type) {
    case "SET_WASM_STATUS":
      return (action.status === "executing") ?
        { ...state, wasmStatus: action.status, resultFragments: List() } : { ...state, wasmStatus: action.status }
    case "CHANGE_QUERY": return { ...state, query: action.query }
    case "UPDATE_FILES_LOADED": return { ...state, filesLoaded: action.filesLoaded }
    case "APPEND_LOG": return { ...state, logMessages: state.logMessages.push(action.msg), logUpdated: true }
    case "RESET_LOG_UPDATED": return { ...state, logUpdated: false }
    case "PRINT_RESULT": return { ...state, resultFragments: state.resultFragments.concat(action.result) }
    default: return state;
  }
};

export const reducers = combineReducers({
  store: reducer,
});

// Store
export function configureStore() {
  const store = createStore(reducers);
  return store;
};

export const store = configureStore();
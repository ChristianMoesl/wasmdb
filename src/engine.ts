/*import { batch } from "react-redux"
import { List } from "immutable"

import {
  WritableStream,
  TransformStream,
  ReadableStream
} from "web-streams-polyfill/ponyfill/es6"

import {
  WorkerResponse,
  WorkerRequest,
  CmdError
} from "./worker"

import {
  FileContent,
  store,
  updateFilesLoaded,
  printResult,
  appendLog,
  setEngineStatus
} from "./store"

const work = require('webworkify')
const workerModule = require('./worker')

const streamSaver =  require("streamsaver")
streamSaver.WritableStream = WritableStream
streamSaver.TransformStream = TransformStream
streamSaver.mitm = window.location.origin + "/mitm.html"

class Engine {
  private worker: Worker = work(workerModule);

  private readonly commandResolvers = new Map<string, any>()
  private readonly commandRejectors = new Map<string, any>()

  private readonly storeUpdateFrequency = 5
  private nextStoreUpdate = 1
  private printedCount = 0

  private printedMessages = List<string>()

  constructor() {
    this.worker.addEventListener('message', (event: any) => this.handle(<WorkerResponse>event.data));
  }



  async executeQuery(query: string) {
    this.printedCount = 0
    this.printedMessages = List()
    this.nextStoreUpdate = 1

    try {
      store.dispatch(setEngineStatus("executing"))

      await this.sendRequestWithExpectedResponse<any>({ command: "executeQuery", query }, "finishedExecution")

      store.dispatch(setEngineStatus("idle"))
    } catch (e) { }
  }

  reset() {
    this.worker.terminate()
    this.worker = work(workerModule);

    batch(() => {
      store.dispatch(appendLog("free files in memory"))
      store.dispatch(updateFilesLoaded([]))
      store.dispatch(appendLog("terminating query executor"))
      store.dispatch(setEngineStatus("idle"))
    })
  }

  async loadFiles(fileHandles: FileList) {

  }

  saveResult(fileName: string) {

}

export const engine = new Engine()*/
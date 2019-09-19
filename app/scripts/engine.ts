import { batch } from "react-redux"
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

  private handle(response: WorkerResponse) {
    switch (response.command) {
      case "filesLoaded": this.resolveResponse(response.answers, response.files); break
      case "finishedExecution":
        store.dispatch(printResult(this.printedMessages))
        this.resolveResponse(response.answers)
        break
      case "log": store.dispatch(appendLog(response.msg)); break
      case "print":
        this.printedMessages = this.printedMessages.push(response.msg)

        if (this.printedMessages.size + this.printedCount === this.nextStoreUpdate) {
          this.nextStoreUpdate *= this.storeUpdateFrequency

          store.dispatch(printResult(this.printedMessages))

          this.printedCount += this.printedMessages.size

          this.printedMessages = List()
        }
        break
      case "error":
        batch(() => {
          store.dispatch(setEngineStatus("idle"))
          store.dispatch(appendLog(response.msg))
        })
        this.rejectResponse(response)
        break
    }
  }

  private rejectResponse(error: CmdError) {
    this.commandResolvers.delete(error.answers)
    const rejector = this.commandRejectors.get(error.answers)
    this.commandRejectors.delete(error.answers)

    rejector(error.msg)
  }

  private resolveResponse(answers: string, data?: any) {
    this.commandRejectors.delete(answers)
    const resolve = this.commandResolvers.get(answers)
    this.commandResolvers.delete(answers)

    resolve(data)
  }

  private async sendRequestWithExpectedResponse<T>(request: WorkerRequest, expectedResponse: string): Promise<T> {
    const self = this
    return new Promise<T>((resolve, reject) => {
      self.worker.postMessage(request)
      self.commandResolvers.set(request.command, resolve)
      self.commandRejectors.set(request.command, reject)
    })
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
    if (fileHandles.length === 0) return

    store.dispatch(setEngineStatus("fileLoading"))

    try {
      const files = await this.sendRequestWithExpectedResponse<FileList>({ command: "loadFiles", files: fileHandles }, "filesLoaded")

      batch(() => {
        store.dispatch(setEngineStatus("idle"))
        store.dispatch(updateFilesLoaded([...<any>files]))
      })
    } catch (e) {
      batch(() => {
        store.dispatch(setEngineStatus("idle"))
        store.dispatch(updateFilesLoaded([]))
      })
    }
  }

  saveResult(fileName: string) {
    store.dispatch(setEngineStatus("savingFile"))

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

      store.dispatch(setEngineStatus("idle"))
    }

    const pump = () => reader.read().then((res: any) =>
      // @ts-ignore
      res.done ? cleanUp(writer) : writer.write(res.value).then(pump))

    pump()
  }
}

export const engine = new Engine()
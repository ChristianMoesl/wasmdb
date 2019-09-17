import { store, updateFilesLoaded, printResult, appendLog, setWasmStatus } from "./store"
import { List } from "immutable"
import { batch } from "react-redux"

import {
  WorkerResponse,
  WorkerRequest,
  CmdError
} from "./worker"

const work = require('webworkify')
const workerModule = require('./worker')

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
          store.dispatch(setWasmStatus("idle"))
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
      store.dispatch(setWasmStatus("executing"))

      await this.sendRequestWithExpectedResponse<any>({ command: "executeQuery", query }, "finishedExecution")

      store.dispatch(setWasmStatus("idle"))
    } catch (e) { }
  }

  reset() {
    this.worker.terminate()
    this.worker = work(workerModule);

    batch(() => {
      store.dispatch(appendLog("free files in memory"))
      store.dispatch(updateFilesLoaded([]))
      store.dispatch(appendLog("terminating query executor"))
      store.dispatch(setWasmStatus("idle"))
    })
  }

  async loadFiles(fileHandles: FileList) {
    store.dispatch(setWasmStatus("fileLoading"))

    try {
      const files = await this.sendRequestWithExpectedResponse<FileList>({ command: "loadFiles", files: fileHandles }, "filesLoaded")

      batch(() => {
        store.dispatch(setWasmStatus("idle"))
        store.dispatch(updateFilesLoaded([...<any>files]))
      })
    } catch (e) {
      store.dispatch(updateFilesLoaded([]))
    }
  }
}

export const engine = new Engine()
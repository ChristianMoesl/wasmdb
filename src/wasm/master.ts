import {List, Map} from "immutable"

import {
  WorkerResponse,
  WorkerRequest,
  CmdError,
  FilePreview,
  CmdFilesLoaded
} from "./worker"

export {FilePreview} from "./worker"
export type EngineStatus = "fileLoading" | "savingFile" | "executing" | "idle"

const work = require('webworkify')
const workerModule = require('./worker')

export function createWasmWorker(log: (msg: string) => void, print: (result: List<string>) => void) {
  let commandResolvers = Map<string, (param: any) => void>()
  let commandRejectors = Map<string, (param: any) => void>()

  const storeUpdateFrequency = 5
  let nextStoreUpdate = 1
  let printedCount = 0
  let printedMessages = List<string>()

  const worker: Worker = work(workerModule);
  const messageListener = (event: any) => handle(<WorkerResponse>event.data)

  worker.addEventListener('message', messageListener)

  function handle(response: WorkerResponse) {
    switch (response.type) {
      case "request":
        switch (response.command) {
          case "log":
            log(response.payload)
            break
          case "print":
            printedMessages = printedMessages.push(response.payload)

            if (printedMessages.size + printedCount === nextStoreUpdate) {
              nextStoreUpdate *= storeUpdateFrequency

              print(printedMessages)

              printedCount += printedMessages.size

              printedMessages = List()
            }
            break
        }
        break
      case "error": rejectResponse(response.answers, response.payload); break
      case "response": resolveResponse(response.answers, response.payload); break
    }
  }

  function rejectResponse(answers: string, payload: any) {
    commandResolvers = commandResolvers.delete(answers)

    if (commandRejectors.has(answers)) {
      const rejector = commandRejectors.get(answers) as ((param: any) => void)
      commandRejectors = commandRejectors.delete(answers)

      rejector(payload)
    }
  }

  function resolveResponse(answers: string, payload: any) {
    commandRejectors = commandRejectors.delete(answers)

    if (commandResolvers.has(answers)) {
      const resolve = commandResolvers.get(answers) as ((param: any) => void)
      commandResolvers = commandResolvers.delete(answers)

      resolve(payload)
    }
  }

  return async function sendRequest<T extends WorkerResponse>(command: string, payload?: any): Promise<T> {
    switch (command) {
      case "executeQuery":
        printedCount = 0
        printedMessages = List()
        nextStoreUpdate = 1
        break
      case "terminateExecution":
        worker.removeEventListener('message', messageListener)
        commandRejectors.forEach(reject => reject(new Error("WASM worker terminated")))
        break
      default: break
    }

    return new Promise<T>((resolve, reject) => {
      worker.postMessage({type: "request", command, payload})
      commandResolvers = commandResolvers.set(command, resolve)
      commandRejectors = commandRejectors.set(command, reject)
    })
  }
}

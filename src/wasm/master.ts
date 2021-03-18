import {List, Map} from "immutable"
import {v4 as uuidv4} from "uuid";

import {
  WorkerResponse,
} from "./worker"

export {FilePreview} from "./worker"
export type EngineStatus = "fileLoading" | "executing" | "idle"

// tslint:disable-next-line:no-var-requires
const work = require('webworkify')

import workerModule = require('./worker')

export function createWasmWorker(log: (msg: string) => void, print: (result: List<string>) => void) {
  let commandResolvers = Map<string, (param: any) => void>()
  let commandRejectors = Map<string, (param: any) => void>()

  const storeUpdateFrequency = 5
  let nextStoreUpdate = 1
  let printedCount = 0
  let printedMessages = List<string>()

  const worker: Worker = work(workerModule);
  const messageListener = (event: any) => handle(event.data as WorkerResponse)

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
      case "error": rejectResponse(response.uuid, response.payload); break
      case "response": resolveResponse(response.uuid, response.payload); break
    }
  }

  function rejectResponse(uuid: string, payload: any) {
    commandResolvers = commandResolvers.delete(uuid)

    if (commandRejectors.has(uuid)) {
      const rejector = commandRejectors.get(uuid) as ((param: any) => void)
      commandRejectors = commandRejectors.delete(uuid)

      rejector(payload)
    }
  }

  function resolveResponse(uuid: string, payload: any) {
    commandRejectors = commandRejectors.delete(uuid)

    if (commandResolvers.has(uuid)) {
      const resolve = commandResolvers.get(uuid) as ((param: any) => void)
      commandResolvers = commandResolvers.delete(uuid)

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
      const uuid = uuidv4()

      worker.postMessage({type: "request", uuid, command, payload})

      commandResolvers = commandResolvers.set(uuid, resolve)
      commandRejectors = commandRejectors.set(uuid, reject)
    })
  }
}

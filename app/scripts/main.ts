import { log, appendResultFragment } from "./gui"
import {
  WorkerResponse,
  WorkerRequest,
  CmdError
} from "./worker"

const work = require('webworkify');

let w: Worker = work(require('./worker'));

function handle(response: WorkerResponse) {
  switch (response.command) {
    case "filesLoaded": resolveResponse(response.answers, response.files); break
    case "finishedExecution": resolveResponse(response.answers); break
    case "log": log(response.msg); break
    case "print": appendResultFragment(response.msg); break
    case "error": rejectResponse(response); break
  }
}

w.addEventListener('message', (event: any) => handle(<WorkerResponse>event.data));

function rejectResponse(error: CmdError) {
  commandResolvers.delete(error.answers)
  const rejector = commandRejectors.get(error.answers)
  commandRejectors.delete(error.answers)

  rejector(error.msg)
}

function resolveResponse(answers: string, data?: any) {
  commandRejectors.delete(answers)
  const resolve = commandResolvers.get(answers)
  commandResolvers.delete(answers)

  resolve(data)
}

const commandResolvers = new Map<string, any>()
const commandRejectors = new Map<string, any>()

async function sendRequestWithExpectedResponse<T>(request: WorkerRequest, expectedResponse: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    w.postMessage(request)
    commandResolvers.set(request.command, resolve)
    commandRejectors.set(request.command, reject)
  })
}

export async function executeQuery(query: string) {
  return sendRequestWithExpectedResponse<any>({ command: "executeQuery", query }, "finishedExecution")
}

export async function loadFiles(fileHandles: FileList) {
  return sendRequestWithExpectedResponse<FileList>({ command: "loadFiles", files: fileHandles }, "filesLoaded")
}

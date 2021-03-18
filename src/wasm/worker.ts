import {run, files, setOnPrintListener} from "./wasm"
import {v4 as uuidv4} from "uuid";

export type FilePreview = {
  name: string,
  contentPreview: string[],
  size: number,
  type: string
}

export type Request = {type: "request", uuid: string, command: string, payload: any}
export type Response = {type: "response", uuid: string, answers: string, payload: any}
export type ErrorResponse = {type: "error", uuid: string, answers: string, payload: string}

export type Cmd = Request | Response | ErrorResponse

export type CmdLoadFiles = {type: "request", uuid: string, command: "loadFiles", payload: File[]}
export type CmdFilesLoaded = {type: "response", uuid: string, answers: "loadFiles", payload: FilePreview[]}
export type CmdExecuteQuery = {type: "request", uuid: string, command: "executeQuery", payload: string}
export type CmdFinishedExec = {type: "response", uuid: string, answers: "executeQuery", payload: null}
export type CmdPrint = {type: "request", uuid: string, command: "print", payload: string}
export type CmdLog = {type: "request", uuid: string, command: "log", payload: string}
export type CmdError = {type: "error", uuid: string, answers: "loadFiles" | "executeQuery", payload: string}

export type WorkerRequest = CmdLoadFiles | CmdExecuteQuery
export type WorkerAnswer = CmdFilesLoaded | CmdFinishedExec | CmdError
export type WorkerResponse = WorkerAnswer | CmdPrint | CmdLog

type FileContent = {
  name: string,
  content: ArrayBuffer
  type: string
  size: number
}

function findEndOFLine(buffer: ArrayBuffer, start: number) {
  const view = new Uint8Array(buffer)

  for (let i = start; i < view.length; i++)
    if (view[i] === '\n'.charCodeAt(0))
      return i

  return view.length
}

function buildPreview(buffer: ArrayBuffer, numberOfLines: number) {
  const decoder = new TextDecoder("utf-8")
  const view = new Uint8Array(buffer)

  let start = 0
  let end = 0
  const result = [] as string[]

  for (let i = 0; i < numberOfLines && start < view.length; i++) {
    end = findEndOFLine(buffer, start)

    const line = decoder.decode(view.subarray(start, end))

    result.push(line)

    start = end + 1
  }

  return result
}

module.exports = (self: any) => {

  async function handle(request: WorkerRequest) {
    try {
      switch (request.command) {
        case "loadFiles":
          const filesLoaded: FileContent[] = await loadFiles(request.payload as File[])

          filesLoaded.forEach(file => {
            files.set(file.name, file.content)
          })

          const filePreviews = filesLoaded.map(file => ({
            name: escape(file.name),
            contentPreview: buildPreview(file.content, 5),
            size: file.size,
            type: file.type || "n/a"
          }))

          postResponse({type: "response", uuid: request.uuid, answers: "loadFiles", payload: filePreviews})
          break
        case "executeQuery":
          await executeQuery(request.payload as string)

          postResponse({type: "response", uuid: request.uuid, answers: "executeQuery", payload: null})
          break
      }
    } catch (e) {
      postResponse({type: "error", uuid: request.uuid, answers: request.command, payload: e.message})
    }
  }

  self.addEventListener('message', (e: any) => handle(e.data as WorkerRequest))

  function postResponse(response: WorkerResponse) {
    self.postMessage(response)
  }

  function log(msg: string) {
    postResponse({type: "request", uuid: uuidv4(), command: "log", payload: msg})
  }

  async function executeQuery(query: string) {

    try {
      const request = `https://api.wasmdb.christianmoesl.com?query=${encodeURIComponent(query)}`

      log(`sending SQL query to server`)
      const response = await fetch(request, {
        headers: {
          'Accept': 'application/wasm'
        }
      })

      if (response.ok) {
        log(`received WASM binary`)
        const binary = Buffer.from(await response.text(), 'base64');


        log(`execute WASM binary`)
        await run(binary);

        log(`finished execution`)
      } else {
        const reason = await response.text()

        throw new Error(`received error ${response.status}
          from ${request}
          with: "${reason}"`)
      }
    } finally {
      flushOutputBuffer();
    }
  }

  async function loadFiles(fileHandles: File[]) {
    return new Promise<FileContent[]>((resolve, reject) => {
      const loadedFiles = [] as FileContent[]

      for (const file of fileHandles) {
        log(`loading ${file.name} into memory`);

        const reader = new FileReader();
        reader.onload = event => {
          loadedFiles.push({
            name: file.name,
            content: event.target!.result as ArrayBuffer,
            type: file.type,
            size: file.size
          })

          log(`finished loading ${file.name}`);

          if (loadedFiles.length === fileHandles.length)
            resolve(loadedFiles)
        };
        reader.onabort = e => reject(e)
        reader.onerror = e => reject(e)
        reader.readAsArrayBuffer(file);
      }
    })
  }

  const fragmentSize = 1000;
  let output = [] as string[]

  function parseData(s: string) {
    if (output.length >= fragmentSize && s === "\n")
      flushOutputBuffer()
    else
      output.push(s);
  }

  setOnPrintListener(parseData);

  function flushOutputBuffer() {
    postResponse({type: "request", uuid: uuidv4(), command: "print", payload: output.join("")})

    output = [] as string[]
  }
}

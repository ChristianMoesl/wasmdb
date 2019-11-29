import {run, files, setOnPrintListener} from "./wasm"

export type FilePreview = {
  name: string,
  contentPreview: Array<string>,
  size: number,
  type: string
}

export type Request = {type: "request", command: string, payload: any}
export type Response = {type: "response", answers: string, payload: any}
export type ErrorResponse = {type: "error", answers: string, payload: string}

export type Cmd = Request | Response | ErrorResponse

export type CmdLoadFiles = {type: "request", command: "loadFiles", payload: Array<File>}
export type CmdFilesLoaded = {type: "response", answers: "loadFiles", payload: Array<FilePreview>}
export type CmdExecuteQuery = {type: "request", command: "executeQuery", payload: string}
export type CmdFinishedExec = {type: "response", answers: "executeQuery", payload: null}
export type CmdPrint = {type: "request", command: "print", payload: string}
export type CmdLog = {type: "request", command: "log", payload: string}
export type CmdError = {type: "error", answers: "loadFiles" | "executeQuery", payload: string}

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
    if (view[i] == '\n'.charCodeAt(0))
      return i

  return view.length
}

function buildPreview(buffer: ArrayBuffer, numberOfLines: number) {
  const decoder = new TextDecoder("utf-8")
  const view = new Uint8Array(buffer)

  let start = 0
  let end = 0
  let result = new Array<string>()

  for (let i = 0; i < numberOfLines && start < view.length; i++) {
    end = findEndOFLine(buffer, start)

    const line = decoder.decode(view.subarray(start, end))

    result.push(line)

    start = end + 1
  }

  return result
}

module.exports = function (self: any) {

  async function handle(request: WorkerRequest) {
    try {
      switch (request.command) {
        case "loadFiles":
          const filesLoaded: Array<FileContent> = await loadFiles(request.payload as Array<File>)

          filesLoaded.forEach(file => {
            files.set(file.name, file.content)
          })

          const filePreviews = filesLoaded.map(file => ({
            name: escape(file.name),
            contentPreview: buildPreview(file.content, 5),
            size: file.size,
            type: file.type || "n/a"
          }))

          postResponse({type: "response", answers: "loadFiles", payload: filePreviews})
          break
        case "executeQuery":
          await executeQuery(request.payload as string)

          postResponse({type: "response", answers: "executeQuery", payload: null})
          break
      }
    } catch (e) {
      postResponse({type: "error", answers: request.command, payload: e.toString()})
    }
  }

  self.addEventListener('message', (e: any) => handle(<WorkerRequest>e.data))

  function postResponse(response: WorkerResponse) {
    self.postMessage(response)
  }

  function log(msg: string) {
    postResponse({type: "request", command: "log", payload: msg})
  }

  async function executeQuery(query: string) {
    try {
      log(`sending SQL query to server`)
      const response = await fetch(`https://api.wasmdb.christianmoesl.com?query=${encodeURIComponent(query)}`, {
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
        log(`received error ${response.status}`)
      }
    } finally {
      flushOutputBuffer();
    }
  }

  async function loadFiles(fileHandles: Array<File>) {
    return new Promise<Array<FileContent>>((resolve, reject) => {
      let files = new Array<FileContent>()

      for (const file of fileHandles) {
        log(`loading ${file.name} into memory`);

        const reader = new FileReader();
        reader.onload = event => {
          files.push({
            name: file.name,
            content: <ArrayBuffer>event.target!.result,
            type: file.type,
            size: file.size
          })

          log(`finished loading ${file.name}`);

          if (files.length === fileHandles.length)
            resolve(files)
        };
        reader.onabort = e => reject(e)
        reader.onerror = e => reject(e)
        reader.readAsArrayBuffer(file);
      }
    })
  }

  const fragmentSize = 1000;
  let output = new Array<string>();

  function parseData(s: string) {
    if (output.length >= fragmentSize && s === "\n")
      flushOutputBuffer()
    else
      output.push(s);
  }

  setOnPrintListener(parseData);

  function flushOutputBuffer() {
    postResponse({type: "request", command: "print", payload: output.join("")})

    output = new Array<string>()
  }
}

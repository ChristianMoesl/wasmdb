import { run, files, setOnPrintListener } from "./wasm"

export type CmdLoadFiles = { command: "loadFiles", files: FileList }
export type CmdFilesLoaded = { command: "filesLoaded", answers: "loadFiles", files: FileList }
export type CmdExecuteQuery = { command: "executeQuery", query: string }
export type CmdFinishedExec = { command: "finishedExecution", answers: "executeQuery" }
export type CmdPrint = { command: "print", msg: string }
export type CmdLog = { command: "log", msg: string }
export type CmdError = { command: "error", answers: "loadFiles" | "executeQuery", msg: string }

export type WorkerRequest = CmdLoadFiles | CmdExecuteQuery
export type WorkerAnswer = CmdFilesLoaded | CmdFinishedExec | CmdError
export type WorkerResponse = WorkerAnswer | CmdPrint | CmdLog

module.exports = function (self: any) {

  async function handle(request: WorkerRequest) {
    try {
      switch (request.command) {
        case "loadFiles":
          const filesLoaded: FileList = await loadFiles(request.files)

          postResponse({ command: "filesLoaded", answers: "loadFiles", files: filesLoaded })
          break
        case "executeQuery":
          await executeQuery(request.query)

          postResponse({ command: "finishedExecution", answers: "executeQuery" })
          break
      }
    } catch (e) {
      postResponse({ command: "error", answers: request.command, msg: e.toString() })
    }
  }

  self.addEventListener('message', (e: any) => handle(<WorkerRequest>e.data))

  function postResponse(response: WorkerResponse) {
    self.postMessage(response)
  }

  function log(msg: string) {
    postResponse({ command: "log", msg })
  }

  async function executeQuery(query: string) {
    try {
      log(`sending SQL query to server`)
      const response = await fetch(`https://p9xas8x1u8.execute-api.us-east-2.amazonaws.com/test/javatest?query=${encodeURIComponent(query)}`, {
        headers: {
          'Accept': 'application/wasm'
        }
      })

      log(`received WASM binary`)
      const binary = Buffer.from(await response.text(), 'base64');

      log(`execute WASM binary`)
      await run(binary);

      log(`finished execution`)
    } finally {
      flushOutputBuffer();
    }
  }

  async function loadFiles(fileHandles: FileList) {
    return new Promise<FileList>((resolve, reject) => {
      files.clear()

      for (var i = 0, f; f = fileHandles[i]; i++) {
        const file = f;

        log(`loading ${file.name} into memory`);

        const reader = new FileReader();
        reader.onload = event => {
          files.set(file.name, <ArrayBuffer>event.target!.result);

          log(`finished loading ${file.name}`);

          if (files.size === fileHandles.length)
            resolve(fileHandles)
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
    postResponse({ command: "print", msg: output.join("") })

    output = new Array<string>()
  }
}

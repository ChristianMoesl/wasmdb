import { run, files, setOnPrintListener } from "./wasm"
import { log, appendResultFragment } from "./gui"

export async function executeQuery(query: string) {
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
  flushOutputBuffer();
}

export async function loadFiles(fileHandles: FileList) {
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

const fragmentSize = 100;
let output = new Array<string>();

function parseData(s: string) {
  if (output.length >= fragmentSize && s === "\n")
    flushOutputBuffer()
  else
    output.push(s);
}

setOnPrintListener(parseData);

function flushOutputBuffer() {
  appendResultFragment(output.join(""))

  output = new Array<string>()
}




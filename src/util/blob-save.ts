import {
  WritableStream,
  TransformStream,
} from "web-streams-polyfill/ponyfill/es6"

const streamSaver = require("streamsaver")
streamSaver.WritableStream = WritableStream
streamSaver.TransformStream = TransformStream
streamSaver.mitm = window.location.origin + "/mitm.html"

export const saveBlob = (name: string, blob: Blob) => new Promise((resolve) => {
  const fileStream = streamSaver.createWriteStream(name, {
    size: blob.size // Makes the procentage visiable in the download
  })

  // create a stream from a blob source
  const readableStream = new Response(blob).body!

  // @ts-ignore
  window.writer = fileStream.getWriter()
  const reader = readableStream.getReader()

  function cleanUp(writer: any) {
    writer.close()

    resolve()
  }

  const pump = () => reader.read().then((res: any) =>
    // @ts-ignore
    res.done ? cleanUp(writer) : writer.write(res.value).then(pump))

  pump()
})


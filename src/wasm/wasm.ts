import printf = require("printf");

export const files = new Map<string, ArrayBuffer>();

type OnPrintListener = (s: string) => void;
let printListener: OnPrintListener;
export function setOnPrintListener(listener: OnPrintListener) {
  printListener = listener
}
function notfiyPrintListener(s: string) {
  if (printListener !== undefined) printListener(s)
}

const heapInGb = 4; // 4 is maximum for wasm32
const bytesPerPage = 64 * 1024;

let mem: any = null;

let allocated = 0;
let bump = 0;

function malloc(size: number): number {
  // for word alignment
  const alignedSize = Math.ceil(size / 8.0) * 8;

  if (alignedSize > allocated - bump) {
    allocated = mem.grow(Math.ceil(alignedSize / bytesPerPage)) * bytesPerPage;

    if (bump === 0) bump = allocated;
  }

  const addr = bump;

  bump = bump + alignedSize;

  return addr;
}

function strlen(arr: Uint8Array): number {
  let len = 0;
  while (arr[len] !== 0) {len++;}
  return len;
}

function str(ptr: number, len?: number): string {
  const buf = new Uint8Array(mem.buffer, ptr);
  const length = len === undefined ? strlen(buf) : len!;
  return String.fromCharCode.apply(null, <any>buf.subarray(0, length));
}

function insertAt(arr: Uint8Array, idx: number, string: string) {
  for (let i = 0; i < string.length; i++)
    arr[idx++] = string.charCodeAt(i);
  arr[idx++] = 0;
  return idx;
}

function save(str: string) {
  const addr = malloc(str.length + 1);
  insertAt(new Uint8Array(mem.buffer), addr, str);
  return addr;
}

function loadArgs(typeMask: number): Array<any> {
  let args = Array<any>();
  for (let i = 0; i < 4; i++) {
    switch ((typeMask >> (i * 8)) & 255) {
      case 0: // no argument
        return args;
      case 1: // boolean
        args.push(new Uint32Array(mem.buffer)[i * 2]);
        break;
      case 2: // char
        args.push(String.fromCharCode(new Uint32Array(mem.buffer)[i * 2]));
        break;
      case 3: // string
        args.push(str(new Uint32Array(mem.buffer)[i * 2]));
        break;
      case 4: // int
        args.push(Number(new Array<bigint>(mem.buffer)[i]));
        break;
      case 5: // long
        args.push(Number(new Array<bigint>(mem.buffer)[i]));
        break;
      case 6: // float
        args.push(new Float32Array(mem.buffer)[i * 2]);
        break;
      case 7: // double
        args.push(new Float64Array(mem.buffer)[i]);
        break;
      default:
        throw new Error("Type not implemented");
    }
  }
  return args;
}

function printlnString(typeMask: number) {
  if (typeMask !== 0)
    loadArgs(typeMask).forEach(x => notfiyPrintListener(x.toString()))

  notfiyPrintListener("\n")
}

function printfString(formatString: number, typeMask: number) {
  notfiyPrintListener(typeMask == null ? str(formatString) : printf(str(formatString), ...loadArgs(typeMask)));
}

function printDataString(start: number, len: number) {
  notfiyPrintListener(str(start, len));
}

function fetchFile(name: number) {
  const file = files.get(str(name));

  if (file === undefined)
    error(`${str(name)} has to be prefetched in browser`);

  const fileBuffer = new Uint8Array(<ArrayBuffer>file);

  const len = fileBuffer.length;
  const start = malloc(len + 4);
  new Uint32Array(mem.buffer, start).fill(len, 0, 1);
  new Uint8Array(mem.buffer, start + 4).set(fileBuffer);
  return start + 4;
}

function error(string: string) {
  throw Error(string);
}

export async function run(binary: BufferSource) {
  allocated = 0;
  bump = 0;

  const memory = new WebAssembly.Memory({
    initial: 256,
    maximum: heapInGb * Math.pow(2, 30) / bytesPerPage
  });

  let env = {
    abortStackOverflow: (err: number) => {throw new Error(`overflow: ` + err);},
    table: new WebAssembly.Table({initial: 0, maximum: 0, element: 'anyfunc'}),
    __table_base: 0,
    memory,
    __memory_base: 1024,
    STACKTOP: 0,
    STACK_MAX: memory.buffer.byteLength,
    malloc: (x: number) => malloc(x),
    println: printlnString,
    printf: printfString,
    printData: printDataString,
    stringSlice: (s: number, start: number, end: number) => save(str(s).slice(start, end)),
    stringToDouble: (s: number) => Number.parseFloat(str(s)),
    stringToInt: (s: number) => Number.parseInt(str(s)),
    stringLength: (s: number) => str(s).length,
    stringCharAt: (s: number, i: number) => str(s).charAt(i),
    readFile: fetchFile,
  };

  try {
    const results = await WebAssembly.instantiate(binary, {env});

    mem = results.instance.exports.mem;

    //@ts-ignore
    return results.instance.exports.Snippet(0);
  } catch (reason) {
    error(reason.toString());
  }
}

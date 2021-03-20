# Heading

## Heading

### Heading

#### Heading

##### Heading

###### Heading

Just a link: https://reactjs.com.

_Italic_ _Italic_ Italic
**Bold** **Bold** Bold

# Heading 1

## Heading

[Link](http://a.com) [Link][1]

![Image](http://url/a.png) ![Image][1]

[1]: http://url/b.jpg Markdown

> Blockquote

- List
- List
- List

* List
* List
* List

1. One
2. Two
3. Three

1) One
2) Two
3) Three

Horizontal rule:

---

Horizontal rule:

\*\*\*

`Inline code` with backticks Inline code with backticks

```
# code block
print '3 backticks or'
print 'indent 4 spaces'
```

# WasmDB ![Build Status](https://github.com/ChristianMoesl/wasmdb/workflows/CI/badge.svg) [![Netlify Status](https://api.netlify.com/api/v1/badges/8cf8bb7e-ef52-4c03-99ec-9cf1c1f9bd3f/deploy-status)](https://app.netlify.com/sites/wasmdb/deploys)

WasmDB is a project of the Programming Language Group at the Department of Computer Sciences of Purdue University in USA Indiana.

This repository contains the client side code of the web application written in typescript/react.
WasmDB compiles SQL queries into highly specialised WebAssembly code to compute the results for a given CSV dataset with close to native performance.

## Build and Run

1. Install [NodeJS](https://nodejs.org/)

2. Clone this repository:

- `git clone https://github.com/ChristianMoesl/wasmdb`
- `cd wasmdb`

3. Download project dependencies and build:

- `npm install`
- `npm run build`

4. Serve web page:

- `npm run serve`

## Project Parts:

- [Lightweight Module Staging (LMS)](https://github.com/TiarkRompf/lms-clean)
- [WebAssembly DSL for LMS](https://github.com/ChristianMoesl/lms-wasm)
- [SQL Query Compiler](https://github.com/ChristianMoesl/wasmdb-backend)
- [Query Executor Web App](https://github.com/ChristianMoesl/wasmdb)

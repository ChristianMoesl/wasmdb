import {parse as generatedParse, SyntaxError as GeneratedError} from "./sql-grammar"

export type SyntaxError = GeneratedError;

export function parse(html: string) {
  return generatedParse(stripWhitespaces(htmlToText(html)))
}

function htmlToText(html: string) {
  return html.replace(/&nbsp;/gm, ' ')
    .replace(/(<strong>|<\/strong>)/gm, '')
    .replace(/<br>/gm, '\n')
}

function stripWhitespaces(text: string) {
  const startMatcher = text.match(/^(\s+)\S.*/)
  const start = startMatcher ? startMatcher[1] : ""

  const endMatcher = text.match(/.*\S(\s+)$/)
  const end = endMatcher ? endMatcher[1] : ""

  const stripped = text.substring(start.length, text.length - end.length)

  return stripped
}

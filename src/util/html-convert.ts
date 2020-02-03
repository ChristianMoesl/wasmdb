export function normalizeHtml(str: string): string {
  return str && str.replace(/&nbsp|\u202F|\u00A0/g, ' ')
}

export function htmlToText(html: string) {
  return html.replace(/&nbsp;/gm, ' ')
    .replace(/(<strong>|<\/strong>)/gm, '')
    .replace(/<br>/gm, '\n')
}

export function textToHtml(text: string) {
  return text.replace(/ /g, '&nbsp;')
    .replace(/\n/g, '<br>')
}

export function stripWhitespaces(text: string) {
  const startMatcher = text.match(/^(\s+)\S.*/)
  const start = startMatcher ? startMatcher[1] : ""

  const endMatcher = text.match(/.*\S(\s+)$/)
  const end = endMatcher ? endMatcher[1] : ""

  const stripped = text.substring(start.length, text.length - end.length)

  return [start, stripped, end]
}


import { nextDayOfMonth, readDate, readTime } from './dates.js'

const NOTE_MARK = /\s+(?:—|–|--|\/\/)\s+|;\s*|(?:^|\s)(?:notes?|uwagi|uwaga|komentarz|комментарий|заметка|메모):\s*/i

const GUESTS =
  /^(?:x\s*)?(\d{1,2})\s*(?:x|os\.?|osob[ay]?|osób|people|persons?|pax|guests?|gości|gosci|p|чел\.?|человека?|гост(?:ей|я|ь)|명|인)?$/i

const GUEST_WORD =
  /^(?:os\.?|osob[ay]?|osób|people|persons?|pax|guests?|gości|gosci|чел\.?|человека?|гост(?:ей|я|ь)|명|인)$/i

const TABLE =
  /(?:^|\s)(?:st(?:ó|o)ł|stolik|st\.|table|tables|t|стол(?:ик)?|테이블|#)\s*(\d{1,2}(?:\s*[+&,/]\s*\d{1,2})*)(?=\s|$)/i

const PHONE = /(?:^|\s)(\+?\d[\d ()-]{5,}\d)(?=\s|$)/

export function readGuests(input) {
  const words = String(input ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return null
  const one = GUESTS.exec(words[0])
  if (one && GUEST_WORD.test(words[1] ?? '')) return { partySize: Number(one[1]), rest: words.slice(2).join(' ') }
  if (one) return { partySize: Number(one[1]), rest: words.slice(1).join(' ') }
  return null
}

export function readTables(input, labels) {
  const found = TABLE.exec(String(input ?? ''))
  if (!found) return null
  const wanted = found[1].split(/\s*[+&,/]\s*/)
  const ids = wanted.map((label) => labels.get(label))
  if (ids.some((id) => !id)) return { unknown: wanted.filter((label) => !labels.get(label)) }
  return { tableIds: ids, rest: String(input).replace(found[0], ' ').replace(/\s+/g, ' ').trim() }
}

export function parseBookingLine(line, { today, labels }) {
  const result = {}
  let text = String(line ?? '').trim()

  const mark = NOTE_MARK.exec(text)
  if (mark) {
    result.notes = text.slice(mark.index + mark[0].length).trim()
    text = text.slice(0, mark.index).trim()
  }

  const date = readDate(text, { today })
  if (date) {
    result.date = date.iso
    text = date.rest
  } else {
    const bareDay = /^(\d{1,2})\.?\s+(.*)$/.exec(text)
    const iso = bareDay && readTime(bareDay[2]) ? nextDayOfMonth(Number(bareDay[1]), today) : null
    if (iso) {
      result.date = iso
      text = bareDay[2]
    }
  }

  const bareHour = /^(\d{1,2})(?=\s|$)/.exec(text)
  const time =
    readTime(text) ??
    (result.date && bareHour && Number(bareHour[1]) >= 10 && Number(bareHour[1]) <= 23
      ? readTime(text, { bare: true })
      : null)
  if (time) {
    result.time = time.time
    text = time.rest
  }

  const guests = readGuests(text)
  if (guests && guests.partySize > 0) {
    result.partySize = guests.partySize
    text = guests.rest
  }

  const tables = readTables(text, labels)
  if (tables?.tableIds) {
    result.tableIds = tables.tableIds
    text = tables.rest
  } else if (tables?.unknown) {
    result.unknownTables = tables.unknown
  }

  const phone = PHONE.exec(text)
  if (phone) {
    result.phone = phone[1].trim()
    text = text.replace(phone[0], ' ')
  }

  const name = text.replace(/\s+/g, ' ').trim()
  if (name) result.name = name
  return result
}

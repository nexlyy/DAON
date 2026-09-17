const DAY_MS = 24 * 60 * 60 * 1000
const pad = (value) => String(value).padStart(2, '0')

const fold = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/ł/g, 'l')
    .replace(/ё/g, 'е')

export const isoOf = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const noon = (year, month, day) => new Date(year, month - 1, day, 12)

function real(year, month, day) {
  const date = noon(year, month, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? isoOf(date)
    : null
}

export function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  return isoOf(new Date(noon(year, month, day).getTime() + days * DAY_MS))
}

export const weekdayOf = (iso) => {
  const [year, month, day] = iso.split('-').map(Number)
  return noon(year, month, day).getDay()
}

const MONTHS = [
  ['jan', 'sty', 'янв'],
  ['feb', 'lut', 'фев'],
  ['mar', 'мар'],
  ['apr', 'kwi', 'апр'],
  ['may', 'maj', 'мая', 'май'],
  ['jun', 'cze', 'июн'],
  ['jul', 'lip', 'июл'],
  ['aug', 'sie', 'авг'],
  ['sep', 'wrz', 'сен'],
  ['oct', 'paz', 'окт'],
  ['nov', 'lis', 'ноя'],
  ['dec', 'gru', 'дек'],
]

function monthOf(word) {
  const folded = fold(word).replace(/\.$/, '')
  if (folded.length < 3) return null
  const index = MONTHS.findIndex((stems) => stems.some((stem) => folded.startsWith(stem)))
  return index === -1 ? null : index + 1
}

const WEEKDAYS = [
  ['sun', 'nd', 'nie', 'niedz', 'вс', 'воскр', '일요일'],
  ['mon', 'pn', 'pon', 'пн', 'понед', '월요일'],
  ['tue', 'wt', 'wto', 'вт', 'вторн', '화요일'],
  ['wed', 'sr', 'sro', 'ср', 'сред', '수요일'],
  ['thu', 'cz', 'czw', 'чт', 'четв', '목요일'],
  ['fri', 'pt', 'pia', 'пт', 'пятн', '금요일'],
  ['sat', 'sb', 'sob', 'сб', 'субб', '토요일'],
]

function weekdayWord(word) {
  const folded = fold(word).replace(/[.,]$/, '')
  for (let day = 0; day < 7; day++) {
    for (const stem of WEEKDAYS[day]) {
      if (folded === stem) return day
      if (stem.length >= 3 && folded.startsWith(stem)) return day
    }
  }
  return null
}

const RELATIVE = [
  [0, ['today', 'dzis', 'dzisiaj', 'сегодня', '오늘']],
  [1, ['tomorrow', 'tmr', 'jutro', 'завтра', '내일']],
  [2, ['pojutrze', 'послезавтра', '모레']],
]

const FILLERS = new Set(['w', 'we', 'on', 'this', 'в', 'во', 'na', 'next', 'the', 'dnia', 'dzien'])

function pickYear(month, day, today, prefer) {
  const year = Number(today.slice(0, 4))
  const candidates = [year - 1, year, year + 1]
    .map((candidate) => real(candidate, month, day))
    .filter(Boolean)
  if (candidates.length === 0) return null
  if (prefer === 'future') return candidates.find((iso) => iso >= today) ?? null
  const distance = (iso) => Math.abs(Date.parse(iso) - Date.parse(today))
  return candidates.sort((a, b) => distance(a) - distance(b))[0]
}

const fullYear = (value) => {
  const year = Number(value)
  return value.length === 2 ? 2000 + year : year
}

export function readDate(input, { today, prefer = 'future' }) {
  const source = String(input ?? '').trim()
  const words = source.split(/\s+/).filter(Boolean)
  if (words.length === 0) return null

  let skip = 0
  while (skip < words.length - 1 && FILLERS.has(fold(words[skip]))) skip++
  const rest = (used) => words.slice(skip + used).join(' ')
  const head = words.slice(skip)
  const first = fold(head[0])

  if (first === 'day' && fold(head[1]) === 'after' && fold(head[2]) === 'tomorrow') {
    return { iso: addDays(today, 2), rest: rest(3) }
  }
  for (const [shift, names] of RELATIVE) {
    if (names.includes(first.replace(/[.,]$/, ''))) return { iso: addDays(today, shift), rest: rest(1) }
  }

  const inDays =
    /^(?:za|in|через)$/.test(first) && /^\d{1,3}$/.test(head[1] ?? '')
      ? Number(head[1])
      : null
  if (inDays !== null && /^(?:dni|dzien|days?|дн|день|дня|дней)/.test(fold(head[2] ?? ''))) {
    return { iso: addDays(today, inDays), rest: rest(3) }
  }
  for (const used of [2, 1]) {
    const later = /^(\d{1,3})일(?:후|뒤)$/.exec(head.slice(0, used).join(''))
    if (later) return { iso: addDays(today, Number(later[1])), rest: rest(used) }
  }

  const iso = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})[.,]?$/.exec(head[0])
  if (iso) {
    const found = real(Number(iso[1]), Number(iso[2]), Number(iso[3]))
    return found ? { iso: found, rest: rest(1) } : null
  }

  const withYear = /^(\d{1,2})([-./])(\d{1,2})\2(\d{4}|\d{2})[.,]?$/.exec(head[0])
  if (withYear) {
    const found = real(fullYear(withYear[4]), Number(withYear[3]), Number(withYear[1]))
    return found ? { iso: found, rest: rest(1) } : null
  }

  const spaced =
    head.length >= 3 && /^\d{1,2}$/.test(head[0]) && /^\d{1,2}$/.test(head[1]) && /^\d{4}$/.test(head[2])
  if (spaced) {
    const found = real(Number(head[2]), Number(head[1]), Number(head[0]))
    return found ? { iso: found, rest: rest(3) } : null
  }

  const dayMonth = /^(\d{1,2})[-./](\d{1,2})[.,]?$/.exec(head[0])
  if (dayMonth) {
    const found = pickYear(Number(dayMonth[2]), Number(dayMonth[1]), today, prefer)
    return found ? { iso: found, rest: rest(1) } : null
  }

  const korean = /^(?:(\d{4})년)?(\d{1,2})월(\d{1,2})일/.exec(head.join('').replace(/\s+/g, ''))
  if (korean) {
    const joined = head.join(' ')
    const consumed = joined.match(/^(?:\d{4}년\s*)?\d{1,2}월\s*\d{1,2}일/)[0]
    const used = consumed.split(/\s+/).length
    const found = korean[1]
      ? real(Number(korean[1]), Number(korean[2]), Number(korean[3]))
      : pickYear(Number(korean[2]), Number(korean[3]), today, prefer)
    return found ? { iso: found, rest: rest(used) } : null
  }

  const dayFirst = /^(\d{1,2})(?:st|nd|rd|th|\.|-?go|-?е|-?го)?$/i.exec(head[0])
  if (dayFirst && head[1] && monthOf(head[1])) {
    const month = monthOf(head[1])
    const year = /^\d{4}[.,]?$/.test(head[2] ?? '') ? Number(head[2].slice(0, 4)) : null
    const found = year
      ? real(year, month, Number(dayFirst[1]))
      : pickYear(month, Number(dayFirst[1]), today, prefer)
    return found ? { iso: found, rest: rest(year ? 3 : 2) } : null
  }

  if (monthOf(head[0]) && /^(\d{1,2})(?:st|nd|rd|th)?[.,]?$/i.test(head[1] ?? '')) {
    const month = monthOf(head[0])
    const day = Number(head[1].match(/\d+/)[0])
    const year = /^\d{4}[.,]?$/.test(head[2] ?? '') ? Number(head[2].slice(0, 4)) : null
    const found = year ? real(year, month, day) : pickYear(month, day, today, prefer)
    return found ? { iso: found, rest: rest(year ? 3 : 2) } : null
  }

  const weekday = weekdayWord(head[0])
  if (weekday !== null) {
    const shift = (weekday - weekdayOf(today) + 7) % 7
    const back = prefer === 'nearest' && shift > 3 ? shift - 7 : shift
    return { iso: addDays(today, back), rest: rest(1) }
  }

  return null
}

const TIME_FILLERS = new Set(['o', 'at', 'в', 'na', 'godz', 'godz.', 'ok', 'ok.', 'okolo', 'about', 'около'])

export function readTime(input, { bare = false } = {}) {
  const original = String(input ?? '').trim().split(/\s+/).filter(Boolean)
  const words = original.map(fold)
  let skip = 0
  while (skip < words.length - 1 && TIME_FILLERS.has(words[skip])) skip++
  const head = words.slice(skip)
  if (head.length === 0) return null

  const done = (hour, minute, used) =>
    valid(hour, minute)
      ? { time: `${pad(hour)}:${pad(minute)}`, rest: original.slice(skip + used).join(' ') }
      : null

  for (const used of [3, 2, 1]) {
    const korean = /^(오전|오후)?(\d{1,2})시(?:(\d{1,2})분|(반))?$/.exec(head.slice(0, used).join(''))
    if (!korean) continue
    let hour = Number(korean[2])
    if (korean[1] === '오후' && hour < 12) hour += 12
    if (korean[1] === '오전' && hour === 12) hour = 0
    return done(hour, korean[4] ? 30 : Number(korean[3] ?? 0), used)
  }

  for (const used of [2, 1]) {
    const twelve = /^(\d{1,2})(?:[:.](\d{2}))?(am|pm)$/.exec(head.slice(0, used).join(''))
    if (!twelve) continue
    const hour = (Number(twelve[1]) % 12) + (twelve[3] === 'pm' ? 12 : 0)
    return done(hour, Number(twelve[2] ?? 0), used)
  }

  const plain = /^(\d{1,2})(?:[:.h](\d{2}))?(h|ч|godz\.?)?$/.exec(head[0])
  if (plain && (bare || skip > 0 || plain[2] !== undefined || plain[3] !== undefined)) {
    return done(Number(plain[1]), Number(plain[2] ?? 0), 1)
  }

  return null
}

const valid = (hour, minute) => hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function prettyDay(iso) {
  const [year, month, day] = iso.split('-')
  return `${WEEKDAY_NAMES[weekdayOf(iso)]} ${day}-${month}-${year}`
}

export const shortDay = (iso) => {
  const [, month, day] = iso.split('-')
  return `${WEEKDAY_NAMES[weekdayOf(iso)]} ${day}.${month}`
}

export function nextDayOfMonth(day, today) {
  const [year, month, current] = today.split('-').map(Number)
  for (let ahead = 0; ahead < 3; ahead++) {
    const target = new Date(year, month - 1 + ahead + (day < current && ahead === 0 ? 1 : 0), 1, 12)
    const found = real(target.getFullYear(), target.getMonth() + 1, day)
    if (found && found >= today) return found
  }
  return null
}

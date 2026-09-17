import { randomBytes } from 'node:crypto'

import { labelsOf, rules, tableById, toISODate, zoneOf, zones } from './availability.js'
import {
  labelIds,
  nextOpenDays,
  openAt,
  openingOn,
  freeTimes,
  STAFF_MAX_PARTY,
  tableOptions,
  tablesStillFree,
  toStaff,
} from './bookings.js'
import { addClosure, listClosures, removeClosure } from './closures.js'
import { addDays, prettyDay, readDate, readTime, shortDay } from './dates.js'
import {
  buildMessage,
  cancelledMessage,
  dayList,
  escapeHtml,
  formatDay,
  helpMessage,
  listMessages,
  movedMessage,
  privateMessage,
  statsMessage,
  releasedMessage,
  welcomeMessage,
} from './message.js'
import { parseBookingLine, readGuests, readTables } from './parse.js'
import { isStaff, nameOf } from './staff.js'
import { reference as newReference, TablesTaken } from './store.js'
import {
  answerCallback,
  deleteMessage,
  editMessage,
  sendMessage,
  setCommands,
} from './telegram.js'

const NL = '\n'
const DRAFT_TTL_MS = 3 * 60 * 60 * 1000
const BOOK_STEPS = ['date', 'guests', 'time', 'table', 'name', 'phone', 'notes']
const MOVE_STEPS = ['date', 'time', 'table']

const COMMANDS = {
  '/start': 'start',
  '/help': 'help',
  '/pomoc': 'help',
  '/today': 'today',
  '/dzisiaj': 'today',
  '/dzis': 'today',
  '/tomorrow': 'tomorrow',
  '/jutro': 'tomorrow',
  '/day': 'day',
  '/dzien': 'day',
  '/all': 'all',
  '/wszystkie': 'all',
  '/list': 'all',
  '/find': 'find',
  '/szukaj': 'find',
  '/book': 'book',
  '/new': 'book',
  '/rezerwuj': 'book',
  '/dodaj': 'book',
  '/move': 'move',
  '/change': 'move',
  '/zmien': 'move',
  '/przenies': 'move',
  '/cancel': 'cancel',
  '/anuluj': 'cancel',
  '/free': 'free',
  '/wolny': 'free',
  '/close': 'close',
  '/zamknij': 'close',
  '/open': 'open',
  '/otworz': 'open',
  '/stats': 'stats',
  '/statystyki': 'stats',
  '/closed': 'help',
  '/zamkniete': 'help',
}

const MENU = [
  ['book', 'Take a booking (phone, walk-in)'],
  ['all', 'Every upcoming reservation'],
  ['today', 'Reservations today'],
  ['tomorrow', 'Reservations tomorrow'],
  ['day', 'Reservations on a day: /day saturday'],
  ['find', 'Find by name, phone or code'],
  ['move', 'Change a reservation: /move DAON-XXXXX'],
  ['cancel', 'Cancel: /cancel DAON-XXXXX'],
  ['free', 'Guests left: /free DAON-XXXXX'],
  ['close', 'Close a day: /close 24.12'],
  ['open', 'Open a closed day: /open 24.12'],
  ['stats', 'Website visits and bookings: /stats 30'],
  ['help', 'Everything the bot can do'],
]

const button = (text, data) => ({ text, callback_data: data })
const rowsOf = (items, size) => {
  const rows = []
  for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size))
  return rows
}

export const cardKeyboard = (reference) => [
  [button('✅ Guests left', `free:${reference}`), button('❌ Cancel', `cancel:${reference}`)],
  [button('✏️ Change', `move:${reference}`)],
]

const zoneShort = (ids) => zones[tableById.get(ids[0])?.zone] ?? ''
const groupLabel = (ids) => ids.map((id) => tableById.get(id)?.label ?? id).join('+')
const guestsWord = (count) => `${count} guest${Number(count) === 1 ? '' : 's'}`

export function createBot({
  token,
  staff,
  store,
  notifyStaff,
  recordSent,
  addAlerts,
  updateAlerts,
  oneAtATime,
  retentionDays,
  onMoved = async () => {},
  onCancelled = async () => {},
  onBooked = () => {},
  stats,
}) {
  const drafts = new Map()
  const today = () => toISODate(new Date())

  const send = (chatId, text, keyboard) => sendMessage(token, chatId, text, keyboard)
  const say = (chatId, text, keyboard) => send(chatId, text, keyboard).catch(() => null)

  async function sayAbout(chatId, texts, date) {
    for (const text of texts) {
      const message = await say(chatId, text)
      if (message && date) recordSent([{ chatId, messageId: message.message_id }], date)
    }
  }

  function dropDraft(chatId) {
    const draft = drafts.get(chatId)
    if (!draft) return
    drafts.delete(chatId)
    if (draft.messageId) deleteMessage(token, chatId, draft.messageId).catch(() => {})
  }

  function liveDraft(chatId) {
    const draft = drafts.get(chatId)
    if (draft && Date.now() - draft.touchedAt > DRAFT_TTL_MS) {
      dropDraft(chatId)
      return null
    }
    return draft ?? null
  }

  function nextStep(draft) {
    if (draft.mode === 'move') {
      const index = MOVE_STEPS.indexOf(draft.step)
      if (draft.editing || index === -1) return draft.tableIds ? 'confirm' : 'table'
      return MOVE_STEPS[index + 1] ?? 'confirm'
    }
    return BOOK_STEPS.find((step) => draft[stepField(step)] === undefined) ?? 'confirm'
  }

  const stepField = (step) => (step === 'guests' ? 'partySize' : step === 'table' ? 'tableIds' : step)

  async function render(draft) {
    const cancel = button('✖ Cancel', `w:${draft.id}:cancel`)
    const keep = (label, action) =>
      draft.mode === 'move' ? [[button(`Keep ${label}`, `w:${draft.id}:keep:${action}`)]] : []
    const title =
      draft.mode === 'move'
        ? `<b>Change <code>${escapeHtml(draft.reference)}</code></b>`
        : '<b>New reservation</b>'
    const known = summaryLines(draft, { short: true })
    const intro = [title, ...(known.length ? ['', ...known] : []), ''].join(NL)

    if (draft.step === 'date') {
      const days = nextOpenDays(today(), 9).map((date) => {
        const label = date === today() ? 'Today' : date === addDays(today(), 1) ? 'Tomorrow' : shortDay(date)
        return button(label, `w:${draft.id}:date:${date}`)
      })
      return {
        text: `${intro}📅 <b>Which day?</b>${NL}Tap a day or type any date: 20.09, 20 września, friday, jutro, 9월 20일…${draft.problem ? `${NL}${NL}⚠️ ${draft.problem}` : ''}`,
        keyboard: [
          ...(draft.mode === 'move' ? keep(shortDay(draft.before.date), 'date') : []),
          ...rowsOf(days, 3),
          [cancel],
        ],
      }
    }

    if (draft.step === 'guests') {
      const counts = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((count) =>
        button(String(count), `w:${draft.id}:guests:${count}`),
      )
      return {
        text: `${intro}👥 <b>How many guests?</b>${NL}Tap or type a number.${draft.problem ? `${NL}${NL}⚠️ ${draft.problem}` : ''}`,
        keyboard: [
          ...(draft.mode === 'move' ? [[button(`Keep ${draft.before.partySize}`, `w:${draft.id}:keep:guests`)]] : []),
          ...rowsOf(counts, 5),
          [cancel],
        ],
      }
    }

    if (draft.step === 'time') {
      const day = openingOn(draft.date)
      const times = day.closed ? [] : await freeTimes(store, draft.date, draft.partySize, draft.reservationId)
      const free = times.filter((slot) => slot.free)
      const lines = [`${intro}🕒 <b>What time?</b>`]
      if (day.closed) {
        lines.push(
          day.reason === 'closure'
            ? `DAON is closed on ${prettyDay(draft.date)} (closed from the bot). Type a time to book anyway, or pick another day.`
            : `${prettyDay(draft.date)} is the weekly day off. Type a time to book anyway, or pick another day.`,
        )
      } else if (free.length === 0) {
        lines.push(`No table is free for ${guestsWord(draft.partySize)} at any usual time. Type a time to look anyway, or change the day.`)
      } else {
        lines.push(`Free times for ${guestsWord(draft.partySize)} (open ${day.open}–${day.close}). Or type any time, e.g. 18:15.`)
      }
      if (draft.problem) lines.push('', `⚠️ ${draft.problem}`)
      const keyboard = rowsOf(free.map((slot) => button(slot.time, `w:${draft.id}:time:${slot.time}`)), 4)
      return {
        text: lines.join(NL),
        keyboard: [
          ...(draft.mode === 'move' ? keep(draft.before.time, 'time') : []),
          ...(draft.warning ? [[button('Book anyway', `w:${draft.id}:force`)]] : []),
          ...keyboard,
          [button('📅 Other day', `w:${draft.id}:edit:date`), button('👥 Guests', `w:${draft.id}:edit:guests`)],
          [cancel],
        ],
      }
    }

    if (draft.step === 'table') {
      const options = await tableOptions(store, {
        date: draft.date,
        time: draft.time,
        partySize: draft.partySize,
        reservationId: draft.reservationId,
      })
      const shown = options.slice(0, 24)
      const lines = [`${intro}🍽 <b>Which table?</b>`]
      if (options.length === 0) {
        lines.push(`Nothing is free for ${guestsWord(draft.partySize)} at ${draft.time} (a table is held ${rules.holdMinutes} minutes either side).`)
      } else {
        lines.push('Smallest fit first. Or type table numbers, e.g. 5+6.')
      }
      if (draft.problem) lines.push('', `⚠️ ${draft.problem}`)
      const current =
        draft.mode === 'move' && draft.before.tableIds.length > 0
          ? options.find((group) => group.join() === draft.before.tableIds.join())
          : null
      return {
        text: lines.join(NL),
        keyboard: [
          ...(current ? [[button(`Keep ${groupLabel(current)}`, `w:${draft.id}:table:${current.join('+')}`)]] : []),
          ...rowsOf(
            shown.map((group) =>
              button(`${groupLabel(group)} · ${zoneShort(group)}`, `w:${draft.id}:table:${group.join('+')}`),
            ),
            3,
          ),
          [button('🕒 Other time', `w:${draft.id}:edit:time`), button('📅 Other day', `w:${draft.id}:edit:date`)],
          [cancel],
        ],
      }
    }

    const prompts = {
      name: ['👤 <b>Guest name?</b>', 'Type it, or skip for a walk-in.'],
      phone: ['📞 <b>Phone number?</b>', 'Type it, or skip.'],
      notes: ['📝 <b>Anything to note?</b>', 'Allergy, occasion, high chair… or skip.'],
    }
    if (prompts[draft.step]) {
      return {
        text: `${intro}${prompts[draft.step].join(NL)}${draft.problem ? `${NL}${NL}⚠️ ${draft.problem}` : ''}`,
        keyboard: [[button('Skip', `w:${draft.id}:skip`)], [cancel]],
      }
    }

    const warnings = []
    const open = openAt(draft.date, draft.time)
    if (!open.ok) warnings.push('⚠️ Outside opening hours — booked anyway.')
    else if (open.late) warnings.push(`⚠️ Later than the usual last seating (${rules.lastSeatingBeforeClose} min before closing).`)
    if (draft.date < today()) warnings.push('⚠️ That day has passed.')

    const saveLabel = draft.mode === 'move' ? '✅ Save the change' : '✅ Book it'
    return {
      text: [
        draft.mode === 'move' ? title : '<b>New reservation — check and confirm</b>',
        ...(draft.mode === 'move'
          ? [`Was: <s>${escapeHtml(`${formatDay(draft.before.date)} ${draft.before.time} · ${guestsWord(draft.before.partySize)} · tables ${labelsOf(draft.before.tableIds) || '—'}`)}</s>`]
          : []),
        '',
        ...summaryLines(draft, { short: false }),
        ...(warnings.length ? ['', ...warnings] : []),
        ...(draft.problem ? ['', `⚠️ ${draft.problem}`] : []),
      ].join(NL),
      keyboard: [
        [button(saveLabel, `w:${draft.id}:save`)],
        [
          button('📅 Day', `w:${draft.id}:edit:date`),
          button('🕒 Time', `w:${draft.id}:edit:time`),
          button('👥 Guests', `w:${draft.id}:edit:guests`),
          button('🍽 Table', `w:${draft.id}:edit:table`),
        ],
        ...(draft.mode === 'book'
          ? [
              [
                button('👤 Name', `w:${draft.id}:edit:name`),
                button('📞 Phone', `w:${draft.id}:edit:phone`),
                button('📝 Notes', `w:${draft.id}:edit:notes`),
              ],
            ]
          : []),
        [cancel],
      ],
    }
  }

  function summaryLines(draft, { short }) {
    const lines = []
    const add = (label, value) => {
      if (value === undefined) {
        if (!short) lines.push(`${label}: —`)
        return
      }
      lines.push(`${label}: <b>${escapeHtml(value === '' ? '—' : value)}</b>`)
    }
    add('Date', draft.date && prettyDay(draft.date))
    add('Guests', draft.partySize && String(draft.partySize))
    add('Time', draft.time)
    add(
      'Tables',
      draft.tableIds && (draft.tableIds.length ? `${labelsOf(draft.tableIds)} (${zoneOf(draft.tableIds)})` : ''),
    )
    if (draft.mode === 'book') {
      add('Name', draft.name)
      add('Phone', draft.phone)
      add('Notes', draft.notes)
    }
    return lines
  }

  async function show(draft, { fresh = false } = {}) {
    draft.touchedAt = Date.now()
    const view = await render(draft)
    draft.problem = null
    if (!fresh && draft.messageId) {
      try {
        await editMessage(token, draft.chatId, draft.messageId, view.text, view.keyboard)
        return
      } catch (failure) {
        if (/not modified/i.test(failure.message)) return
      }
    }
    if (draft.messageId) deleteMessage(token, draft.chatId, draft.messageId).catch(() => {})
    const message = await send(draft.chatId, view.text, view.keyboard)
    draft.messageId = message.message_id
  }

  function advance(draft) {
    draft.step = nextStep(draft)
    draft.warning = false
  }

  function setDate(draft, iso) {
    if (iso < today()) {
      draft.problem = `${prettyDay(iso)} has already passed.`
      return false
    }
    const changed = draft.date !== iso
    draft.date = iso
    if (changed && draft.mode === 'book') draft.tableIds = undefined
    if (changed && draft.mode === 'move') draft.tableIds = undefined
    return true
  }

  function setTime(draft, time) {
    const open = openAt(draft.date, time)
    const changed = draft.time !== time
    draft.time = time
    if (changed) draft.tableIds = undefined
    if (!open.ok && !draft.force) {
      draft.problem =
        open.reason === 'hours'
          ? `${time} is outside opening hours (${open.open}–${open.close}).`
          : `DAON is closed that day.`
      draft.warning = true
      return false
    }
    return true
  }

  async function startBooking(chatId, line) {
    dropDraft(chatId)
    const parsed = parseBookingLine(line, { today: today(), labels: labelIds })
    const draft = {
      id: randomBytes(3).toString('hex'),
      mode: 'book',
      chatId,
      step: 'date',
      touchedAt: Date.now(),
    }
    drafts.set(chatId, draft)

    if (parsed.date && !setDate(draft, parsed.date)) {
      draft.step = 'date'
      return show(draft)
    }
    if (parsed.partySize) draft.partySize = Math.min(parsed.partySize, STAFF_MAX_PARTY)
    if (parsed.time && draft.date) setTime(draft, parsed.time)
    if (parsed.name) draft.name = parsed.name.slice(0, 80)
    if (parsed.phone) draft.phone = parsed.phone.slice(0, 40)
    if (parsed.notes) draft.notes = parsed.notes.slice(0, 400)
    if (parsed.tableIds && draft.date && draft.time && draft.partySize) {
      await chooseTables(draft, parsed.tableIds)
    }
    if (parsed.unknownTables) draft.problem = `There is no table ${parsed.unknownTables.join(', ')}.`

    draft.step = draft.warning ? 'time' : nextStep(draft)
    return show(draft)
  }

  async function startMove(chatId, reference, line = '') {
    const booking = await store.find(reference)
    if (!booking) return say(chatId, `No reservation ${escapeHtml(reference)}.`)
    if (booking.status === 'cancelled') return say(chatId, `${escapeHtml(reference)} was cancelled.`)

    dropDraft(chatId)
    const draft = {
      id: randomBytes(3).toString('hex'),
      mode: 'move',
      chatId,
      reference: booking.reference,
      reservationId: booking.id,
      before: booking,
      date: booking.date,
      time: booking.time,
      partySize: booking.partySize,
      tableIds: undefined,
      step: 'date',
      touchedAt: Date.now(),
    }
    drafts.set(chatId, draft)

    if (line.trim()) {
      const parsed = parseBookingLine(line, { today: today(), labels: labelIds })
      if (parsed.date) setDate(draft, parsed.date)
      if (parsed.time) setTime(draft, parsed.time)
      if (parsed.partySize) draft.partySize = Math.min(parsed.partySize, STAFF_MAX_PARTY)
      if (parsed.tableIds) await chooseTables(draft, parsed.tableIds)
      draft.editing = true
      draft.step = draft.warning ? 'time' : draft.tableIds ? 'confirm' : 'table'
    }
    return show(draft)
  }

  async function chooseTables(draft, tableIds) {
    const unknown = tableIds.filter((id) => !tableById.has(id))
    if (unknown.length) {
      draft.problem = 'Unknown table.'
      return false
    }
    const free = await tablesStillFree(store, { ...draft, tableIds })
    if (!free) {
      draft.problem = `Table ${labelsOf(tableIds)} is taken around ${draft.time}.`
      return false
    }
    const seats = tableIds.reduce((total, id) => total + (tableById.get(id)?.seats ?? 0), 0)
    if (seats < draft.partySize) {
      draft.problem = `Table ${labelsOf(tableIds)} seats ${seats}, not ${draft.partySize}.`
      return false
    }
    draft.tableIds = tableIds
    return true
  }

  async function answerText(draft, message) {
    const text = String(message.text ?? '').trim()
    deleteMessage(token, draft.chatId, message.message_id).catch(() => {})

    switch (draft.step) {
      case 'date': {
        const found = readDate(text, { today: today() })
        if (!found) draft.problem = `I could not read “${escapeHtml(text)}” as a date.`
        else if (setDate(draft, found.iso)) advance(draft)
        break
      }
      case 'guests': {
        const found = readGuests(text)
        if (!found || found.partySize < 1) draft.problem = 'Type the number of guests, e.g. 4.'
        else if (found.partySize > STAFF_MAX_PARTY) draft.problem = `Up to ${STAFF_MAX_PARTY} guests in one booking.`
        else {
          if (draft.partySize !== found.partySize) draft.tableIds = undefined
          draft.partySize = found.partySize
          advance(draft)
        }
        break
      }
      case 'time': {
        const found = readTime(text, { bare: true })
        if (!found) draft.problem = `I could not read “${escapeHtml(text)}” as a time.`
        else if (setTime(draft, found.time)) advance(draft)
        break
      }
      case 'table': {
        const found = readTables(`table ${text.replace(/^(?:st(?:ó|o)ł|stolik|table|t|стол|#)\s*/i, '')}`, labelIds)
        if (!found?.tableIds) draft.problem = 'Type table numbers, e.g. 7 or 5+6.'
        else if (await chooseTables(draft, found.tableIds)) advance(draft)
        break
      }
      case 'name':
        draft.name = text.slice(0, 80)
        advance(draft)
        break
      case 'phone':
        if (text.replace(/\D/g, '').length < 7) draft.problem = 'That does not look like a phone number.'
        else {
          draft.phone = text.slice(0, 40)
          advance(draft)
        }
        break
      case 'notes':
        draft.notes = text.slice(0, 400)
        advance(draft)
        break
      default:
        draft.problem = 'Use the buttons to confirm or change something.'
    }
    return show(draft)
  }

  async function save(draft, user) {
    const by = nameOf(user)
    if (draft.date < today()) {
      draft.problem = 'That day has passed.'
      draft.step = 'date'
      return show(draft)
    }

    if (draft.mode === 'book') {
      const outcome = await oneAtATime(async () => {
        if (!(await tablesStillFree(store, draft))) return { taken: true }
        const record = {
          id: `bk_${Date.now().toString(36)}`,
          reference: newReference(),
          date: draft.date,
          time: draft.time,
          partySize: draft.partySize,
          tableIds: draft.tableIds,
          name: draft.name ?? '',
          phone: draft.phone ?? '',
          notes: draft.notes ?? '',
          locale: '',
          createdAt: new Date().toISOString(),
          status: 'confirmed',
        }
        try {
          await store.create(record)
          return { record }
        } catch (failure) {
          if (failure instanceof TablesTaken) return { taken: true }
          throw failure
        }
      })

      if (outcome.taken) {
        draft.tableIds = undefined
        draft.step = 'table'
        draft.problem = 'Someone has just taken that table. Pick another.'
        return show(draft)
      }

      drafts.delete(draft.chatId)
      onBooked()
      const card = buildMessage(toStaff(outcome.record), { by })
      const keyboard = cardKeyboard(outcome.record.reference)
      const mine = await editMessage(token, draft.chatId, draft.messageId, card, keyboard)
        .then(() => ({ chatId: draft.chatId, messageId: draft.messageId }))
        .catch(async () => {
          const message = await send(draft.chatId, card, keyboard)
          return { chatId: draft.chatId, messageId: message.message_id }
        })
      const others = await notifyStaff(card, keyboard, { except: draft.chatId })
      addAlerts(outcome.record.reference, [mine, ...others])
      recordSent([mine, ...others], outcome.record.date)
      return
    }

    const outcome = await oneAtATime(async () => {
      const booking = await store.find(draft.reference)
      if (!booking || booking.status === 'cancelled') return { gone: true }
      if (!(await tablesStillFree(store, draft))) return { taken: true }
      try {
        const after = await store.move(draft.reference, {
          date: draft.date,
          time: draft.time,
          partySize: draft.partySize,
          tableIds: draft.tableIds,
        })
        return { before: booking, after }
      } catch (failure) {
        if (failure instanceof TablesTaken) return { taken: true }
        throw failure
      }
    })

    if (outcome.gone) {
      dropDraft(draft.chatId)
      return say(draft.chatId, `${escapeHtml(draft.reference)} is no longer active.`)
    }
    if (outcome.taken) {
      draft.tableIds = undefined
      draft.step = 'table'
      draft.problem = 'Someone has just taken that table. Pick another.'
      return show(draft)
    }

    drafts.delete(draft.chatId)
    await announceMove(outcome.before, outcome.after, by, draft)
  }

  async function announceMove(before, after, by, draft) {
    const card = movedMessage(toStaff(before), toStaff(after), by)
    const keyboard = cardKeyboard(after.reference)
    await updateAlerts(after.reference, card, null, keyboard)
    let mine = []
    if (draft) {
      mine = await editMessage(token, draft.chatId, draft.messageId, card, keyboard)
        .then(() => [{ chatId: draft.chatId, messageId: draft.messageId }])
        .catch(() => [])
    }
    const others = await notifyStaff(card, keyboard, { except: draft?.chatId })
    addAlerts(after.reference, [...mine, ...others])
    recordSent([...mine, ...others], after.date)
    onMoved(before, after).catch((failure) => console.error('Could not email the guest:', failure.message))
  }

  async function onCommand(message, action, args) {
    const chatId = message.chat.id
    const argText = args.join(' ')

    switch (action) {
      case 'start':
        return say(chatId, welcomeMessage())
      case 'help':
        return say(chatId, helpMessage(listClosures(today())))
      case 'today':
      case 'tomorrow': {
        const date = action === 'today' ? today() : addDays(today(), 1)
        return sayAbout(chatId, dayList(date, (await store.onDate(date)).map(toStaff)), date)
      }
      case 'day': {
        const found = readDate(argText, { today: today(), prefer: 'nearest' })
        if (!found) return say(chatId, 'Which day? /day saturday, /day 24.12, /day 20 września')
        return sayAbout(chatId, dayList(found.iso, (await store.onDate(found.iso)).map(toStaff)), found.iso)
      }
      case 'all': {
        const past = /^(past|old|history|minione|stare|прошл)/i.test(argText)
        const from = past ? addDays(today(), -retentionDays) : today()
        const to = past ? addDays(today(), -1) : addDays(today(), 400)
        const bookings = (await store.between(from, to)).map(toStaff)
        const texts = listMessages(
          past ? `Past reservations, last ${retentionDays} days` : 'Upcoming reservations',
          bookings,
          past ? 'Nothing in the last days.' : 'Nothing booked yet.',
        )
        return sayAbout(chatId, texts, bookings[0]?.date ?? today())
      }
      case 'find': {
        if (!argText.trim()) return say(chatId, 'Who? /find Anna, /find 600 123, /find DAON-AB12C')
        const found = (await store.search(argText, addDays(today(), -retentionDays))).map(toStaff)
        const texts = listMessages(`Found for “${argText}”`, found, 'No reservation matches.')
        return sayAbout(chatId, texts, found[0]?.date ?? today())
      }
      case 'book':
        return startBooking(chatId, argText)
      case 'stats': {
        const count = Math.min(Math.max(Number.parseInt(argText, 10) || 7, 1), 90)
        return say(chatId, statsMessage(stats.days(count)))
      }
      case 'move': {
        const reference = (args[0] ?? '').toUpperCase()
        if (!/^DAON-/.test(reference)) return say(chatId, 'Which one? /move DAON-XXXXX (the code is on every booking card, or use /find).')
        return startMove(chatId, reference, args.slice(1).join(' '))
      }
      case 'cancel': {
        const draft = liveDraft(chatId)
        const reference = (args[0] ?? '').toUpperCase()
        if (!reference && draft) {
          dropDraft(chatId)
          return say(chatId, 'Dropped the unfinished booking.')
        }
        if (!/^DAON-/.test(reference)) return say(chatId, 'Which one? /cancel DAON-XXXXX')
        const booking = await store.find(reference)
        if (!booking) return say(chatId, `No reservation ${escapeHtml(reference)}.`)
        if (booking.status === 'cancelled') return say(chatId, `${escapeHtml(reference)} is already cancelled.`)
        const card = [`<b>Cancel this reservation?</b>`, '', ...buildMessage(toStaff(booking)).split(NL).slice(2)].join(NL)
        const sent = await say(chatId, card, [[button('❌ Yes, cancel it', `cancel:${reference}`), button('Keep it', 'dismiss')]])
        if (sent) recordSent([{ chatId, messageId: sent.message_id }], booking.date)
        return
      }
      case 'free': {
        const reference = (args[0] ?? '').toUpperCase()
        if (!reference) return say(chatId, 'Which one? /free DAON-XXXXX')
        const booking = await store.find(reference)
        if (!booking) return say(chatId, `No reservation ${escapeHtml(reference)}.`)
        if (booking.tableIds.length === 0) return say(chatId, `${escapeHtml(reference)} is not holding a table.`)
        const notice = releasedMessage(toStaff(booking), nameOf(message.from))
        await store.release(reference)
        await updateAlerts(reference, notice)
        return sayAbout(chatId, [notice], booking.date)
      }
      case 'close':
      case 'open': {
        const found = readDate(argText, { today: today() })
        if (!found) return say(chatId, `Which day? /${action} 24.12${action === 'close' ? ' Christmas Eve' : ''}`)
        const day = prettyDay(found.iso)
        if (action === 'open') {
          return say(
            chatId,
            removeClosure(found.iso)
              ? `${day} is open again — bookings are back and the website shows the usual hours.`
              : `${day} was not closed.`,
          )
        }
        const booked = await store.onDate(found.iso)
        const added = addClosure(found.iso, found.rest)
        return say(
          chatId,
          [
            added
              ? `${day} is closed — no new bookings, and the website shows DAON as closed that day.`
              : `${day} was already closed.`,
            booked.length > 0
              ? `${NL}Careful: ${booked.length} reservation(s) already that day. Call them — /day ${found.iso.split('-').reverse().join('.')}`
              : '',
          ]
            .filter(Boolean)
            .join(NL),
        )
      }
    }
  }

  async function onMessage(message) {
    if (!message.chat?.id) return
    const text = String(message.text ?? '').trim()
    const chatId = message.chat.id

    if (!isStaff(staff, message.from, message.chat)) {
      if (text.split(/\s+/)[0].split('@')[0].toLowerCase() === '/start' && message.chat.type === 'private') {
        return say(chatId, privateMessage())
      }
      return 'stranger'
    }

    if (text.startsWith('/')) {
      const [raw, ...args] = text.split(/\s+/)
      const action = COMMANDS[raw.split('@')[0].toLowerCase()]
      if (!action) return say(chatId, 'I do not know that command. /help')
      if (args.length > 0 && ['book', 'move', 'find'].includes(action)) {
        deleteMessage(token, chatId, message.message_id).catch(() => {})
      }
      return onCommand(message, action, args)
    }

    const draft = liveDraft(chatId)
    if (draft && text) return answerText(draft, message)
    if (text) return say(chatId, 'To take a booking send /book. Everything else: /help')
  }

  async function onCallback(query) {
    const chatId = query.message?.chat?.id
    const data = String(query.data ?? '')
    const ack = (text) => answerCallback(token, query.id, text).catch(() => {})

    if (!isStaff(staff, query.from, query.message?.chat)) return ack('Not allowed.')

    if (data === 'dismiss') {
      await ack('')
      return deleteMessage(token, chatId, query.message.message_id).catch(() => {})
    }

    if (data.startsWith('free:')) return pressFree(query, data.slice(5))
    if (data.startsWith('cancel:')) return pressCancel(query, data.slice(7))
    if (data.startsWith('move:')) {
      await ack('')
      return startMove(chatId, data.slice(5))
    }
    if (!data.startsWith('w:')) return ack('')

    const [, id, action, ...rest] = data.split(':')
    const value = rest.join(':')
    const draft = liveDraft(chatId)
    if (!draft || draft.id !== id) {
      await ack('This form is closed. Start again with /book.')
      return deleteMessage(token, chatId, query.message.message_id).catch(() => {})
    }
    draft.messageId = query.message.message_id

    switch (action) {
      case 'cancel':
        await ack('Dropped.')
        return dropDraft(chatId)
      case 'date':
        if (setDate(draft, value)) advance(draft)
        break
      case 'guests':
        if (draft.partySize !== Number(value)) draft.tableIds = undefined
        draft.partySize = Number(value)
        advance(draft)
        break
      case 'time':
        if (setTime(draft, value)) advance(draft)
        break
      case 'force':
        draft.force = true
        draft.warning = false
        advance(draft)
        break
      case 'table':
        if (await chooseTables(draft, value.split('+'))) advance(draft)
        break
      case 'skip':
        draft[stepField(draft.step)] = ''
        advance(draft)
        break
      case 'keep':
        if (value === 'guests') {
          draft.partySize = draft.before.partySize
          advance(draft)
        } else if (value === 'date' ? setDate(draft, draft.before.date) : setTime(draft, draft.before.time)) {
          advance(draft)
        }
        break
      case 'edit':
        draft.editing = true
        draft.step = value
        break
      case 'save':
        await ack('Saving…')
        return save(draft, query.from)
    }

    await ack('')
    return show(draft)
  }

  async function pressFree(query, reference) {
    const chatId = query.message?.chat?.id
    const ack = (text) => answerCallback(token, query.id, text).catch(() => {})
    const booking = await store.find(reference)
    if (!booking) return ack('That reservation is gone.')
    if (booking.status === 'cancelled' || booking.tableIds.length === 0) return ack('That table is already free.')

    const notice = releasedMessage(toStaff(booking), nameOf(query.from))
    await store.release(reference)
    await ack('Table is free again.')
    await updateAlerts(reference, notice, { chatId, messageId: query.message.message_id })
  }

  async function pressCancel(query, reference) {
    const chatId = query.message?.chat?.id
    const ack = (text) => answerCallback(token, query.id, text).catch(() => {})
    const booking = await store.find(reference)
    if (!booking) return ack('That reservation is gone.')
    if (booking.status === 'cancelled') return ack('Already cancelled.')

    await store.cancel(reference)
    onCancelled(booking).catch((failure) => console.error('Could not email the guest:', failure.message))
    await ack('Cancelled. The table is free again.')
    const notice = cancelledMessage(toStaff(booking), `the restaurant (${nameOf(query.from)})`)
    await updateAlerts(reference, notice, { chatId, messageId: query.message.message_id })
  }

  async function setup() {
    for (const id of staff) {
      await setCommands(
        token,
        id,
        MENU.map(([command, description]) => ({ command, description })),
      ).catch(() => {})
    }
  }

  return { onMessage, onCallback, setup, announceMove }
}

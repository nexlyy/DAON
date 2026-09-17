import { labelsOf } from './availability.js'
import { escapeHtml } from './message.js'

const COPY = {
  pl: {
    lang: 'pl',
    hello: (name) => (name ? `Dzień dobry, ${name}!` : 'Dzień dobry!'),
    confirmSubject: (when) => `Rezerwacja w DAON: ${when}`,
    confirmLead: 'Twoja rezerwacja jest przyjęta. Nie trzeba jej potwierdzać.',
    reminderSubject: (time) => `Do zobaczenia jutro w DAON o ${time}`,
    reminderLead: 'Przypominamy o jutrzejszej rezerwacji.',
    changedSubject: (when) => `Rezerwacja w DAON zmieniona: ${when}`,
    changedLead: 'Rezerwacja została zmieniona. Aktualne szczegóły:',
    cancelledSubject: 'Rezerwacja w DAON odwołana',
    cancelledLead: (reference, when) => `Rezerwacja ${reference} na ${when} została odwołana.`,
    cancelledNext: (site, phone) =>
      `Jeśli to pomyłka albo chcesz wybrać inny termin, zarezerwuj na ${site} lub zadzwoń: ${phone}.`,
    date: 'Data',
    time: 'Godzina',
    guests: 'Liczba osób',
    tables: 'Stolik',
    reference: 'Numer rezerwacji',
    manage: 'Zmień termin lub odwołaj rezerwację',
    calendar: 'W załączniku jest plik do dodania wizyty do kalendarza.',
    call: (phone) => `Jeśli masz pytania, zadzwoń: ${phone}.`,
    footer: (company, site) =>
      `Ten e-mail wysłaliśmy, bo ten adres podano przy rezerwacji na stronie. Usuniemy go dzień po wizycie. ${company} · ${site}/privacy`,
    calendarTitle: 'Rezerwacja',
  },
  en: {
    lang: 'en',
    hello: (name) => (name ? `Hello ${name},` : 'Hello,'),
    confirmSubject: (when) => `Your table at DAON: ${when}`,
    confirmLead: 'Your reservation is booked. There is nothing else to confirm.',
    reminderSubject: (time) => `See you tomorrow at DAON, ${time}`,
    reminderLead: 'A reminder about your reservation tomorrow.',
    changedSubject: (when) => `Your DAON reservation has changed: ${when}`,
    changedLead: 'Your reservation has been changed. These are the details now:',
    cancelledSubject: 'Your DAON reservation is cancelled',
    cancelledLead: (reference, when) => `Reservation ${reference} for ${when} has been cancelled.`,
    cancelledNext: (site, phone) =>
      `If that is a mistake, or you would like another time, book at ${site} or call ${phone}.`,
    date: 'Date',
    time: 'Time',
    guests: 'Guests',
    tables: 'Table',
    reference: 'Reservation number',
    manage: 'Change or cancel your reservation',
    calendar: 'The attached file adds the visit to your calendar.',
    call: (phone) => `Questions? Call us: ${phone}.`,
    footer: (company, site) =>
      `We sent this because this address was given when booking on our website. We delete it the day after your visit. ${company} · ${site}/privacy`,
    calendarTitle: 'Reservation',
  },
  ko: {
    lang: 'ko',
    hello: (name) => (name ? `${name}님, 안녕하세요.` : '안녕하세요.'),
    confirmSubject: (when) => `DAON 예약 확정: ${when}`,
    confirmLead: '예약이 완료되었습니다. 따로 확인하실 필요는 없습니다.',
    reminderSubject: (time) => `내일 ${time} DAON에서 뵙겠습니다`,
    reminderLead: '내일 예약을 알려 드립니다.',
    changedSubject: (when) => `DAON 예약 변경: ${when}`,
    changedLead: '예약이 변경되었습니다. 현재 예약 내용은 다음과 같습니다.',
    cancelledSubject: 'DAON 예약 취소',
    cancelledLead: (reference, when) => `${when} 예약(${reference})이 취소되었습니다.`,
    cancelledNext: (site, phone) =>
      `잘못된 취소이거나 다른 시간으로 예약하시려면 ${site}에서 예약하시거나 ${phone}로 전화해 주세요.`,
    date: '날짜',
    time: '시간',
    guests: '인원',
    tables: '테이블',
    reference: '예약 번호',
    manage: '예약 변경 또는 취소',
    calendar: '첨부 파일로 캘린더에 방문 일정을 추가할 수 있습니다.',
    call: (phone) => `문의: ${phone}`,
    footer: (company, site) =>
      `DAON 웹사이트에서 예약하실 때 이 주소를 입력하셔서 보내 드리는 메일입니다. 이 주소는 방문 다음 날 삭제됩니다. ${company} · ${site}/privacy`,
    calendarTitle: '예약',
  },
}

const PATHS = { pl: '', en: '/en', ko: '/ko' }

export const localeOf = (value) => (COPY[value] ? value : 'pl')

export function prettyDate(locale, date) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Warsaw',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

export const prettyWhen = (locale, date, time) => `${prettyDate(locale, date)}, ${time}`

export const manageLink = (restaurant, locale, reference, token) =>
  `${restaurant.site}${PATHS[localeOf(locale)]}/reservation?booking=${encodeURIComponent(reference)}&token=${encodeURIComponent(token)}`

const WARSAW_ZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Warsaw',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
]

const icsText = (value) => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

export function calendarFile(restaurant, booking, title) {
  const [hour, minute] = booking.time.split(':').map(Number)
  const stamp = (date, h, m) => `${date.replace(/-/g, '')}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DAON//Reservation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...WARSAW_ZONE,
    'BEGIN:VEVENT',
    `UID:${booking.reference}@daon`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;TZID=Europe/Warsaw:${stamp(booking.date, hour, minute)}`,
    `DTEND;TZID=Europe/Warsaw:${stamp(booking.date, Math.min(hour + 2, 23), hour + 2 > 23 ? 59 : minute)}`,
    `SUMMARY:${icsText(`${restaurant.name} — ${title}`)}`,
    `LOCATION:${icsText(`${restaurant.name}, ${restaurant.address}`)}`,
    `DESCRIPTION:${icsText(`${booking.reference} · ${booking.partySize} · ${restaurant.phone}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function layout(copy, restaurant, { lead, rows, link, extra }) {
  const text = [
    ...lead,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `${restaurant.name}, ${restaurant.address}`,
    ...(link ? ['', `${copy.manage}: ${link}`] : []),
    ...extra,
    '',
    '—',
    copy.footer(restaurant.company, restaurant.site),
  ].join('\n')

  const cell = 'padding:6px 0;border-bottom:1px solid #eadfcd;'
  const html = `<!doctype html>
<html lang="${copy.lang}">
<body style="margin:0;padding:0;background:#f4eee4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eee4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf8f3;border:1px solid #d9c395;border-radius:14px;font-family:Georgia,'Times New Roman',serif;color:#2f4256;">
<tr><td style="padding:28px 28px 8px;text-align:center;font-size:26px;letter-spacing:4px;">DAON</td></tr>
<tr><td style="padding:8px 28px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#3d3a33;">
${lead.map((line) => `<p style="margin:0 0 10px;">${escapeHtml(line)}</p>`).join('\n')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 18px;font-size:15px;">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="${cell}color:#7a7266;width:45%;">${escapeHtml(label)}</td><td style="${cell}font-weight:bold;color:#2f4256;">${escapeHtml(value)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="margin:0 0 16px;">${escapeHtml(`${restaurant.name}, ${restaurant.address}`)}</p>
${link ? `<p style="margin:0 0 18px;text-align:center;"><a href="${escapeHtml(link)}" style="display:inline-block;padding:11px 22px;border-radius:999px;background:#2f4256;color:#fbf8f3;text-decoration:none;font-size:14px;letter-spacing:1px;">${escapeHtml(copy.manage)}</a></p>` : ''}
${extra.map((line) => `<p style="margin:0 0 10px;">${escapeHtml(line)}</p>`).join('\n')}
</td></tr>
<tr><td style="padding:14px 28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#97907f;">${escapeHtml(copy.footer(restaurant.company, restaurant.site))}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  return { text, html }
}

const detailRows = (copy, locale, booking) => [
  [copy.date, prettyDate(locale, booking.date)],
  [copy.time, booking.time],
  [copy.guests, String(booking.partySize)],
  ...(booking.tableIds?.length ? [[copy.tables, labelsOf(booking.tableIds)]] : []),
  [copy.reference, booking.reference],
]

export function bookingEmail(kind, { restaurant, booking, locale: wanted, name, token }) {
  const locale = localeOf(wanted)
  const copy = COPY[locale]
  const when = prettyWhen(locale, booking.date, booking.time)
  const link = token ? manageLink(restaurant, locale, booking.reference, token) : null
  const ics = {
    name: `daon-${booking.reference}.ics`,
    type: 'text/calendar; charset=UTF-8; method=PUBLISH',
    content: calendarFile(restaurant, booking, copy.calendarTitle),
  }

  if (kind === 'cancelled') {
    return {
      subject: copy.cancelledSubject,
      ...layout(copy, restaurant, {
        lead: [copy.hello(name), copy.cancelledLead(booking.reference, when)],
        rows: [],
        link: null,
        extra: [copy.cancelledNext(`${restaurant.site}${PATHS[locale]}/reservation`, restaurant.phone)],
      }),
      attachments: [],
    }
  }

  const subject =
    kind === 'reminder'
      ? copy.reminderSubject(booking.time)
      : kind === 'changed'
        ? copy.changedSubject(when)
        : copy.confirmSubject(when)
  const lead =
    kind === 'reminder' ? copy.reminderLead : kind === 'changed' ? copy.changedLead : copy.confirmLead

  return {
    subject,
    ...layout(copy, restaurant, {
      lead: [copy.hello(name), lead],
      rows: detailRows(copy, locale, booking),
      link,
      extra: [...(kind === 'reminder' ? [] : [copy.calendar]), copy.call(restaurant.phone)],
    }),
    attachments: kind === 'reminder' ? [] : [ics],
  }
}

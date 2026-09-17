import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const problems = []
const warnings = []

function load(relative) {
  const text = readFileSync(resolve(root, relative), 'utf8')
  try {
    return JSON.parse(text)
  } catch (failure) {
    const at = Number(/position (\d+)/.exec(failure.message)?.[1] ?? /column (\d+)/.exec(failure.message)?.[1])
    let where = ''
    if (Number.isFinite(at)) {
      const before = text.slice(0, at)
      const line = before.split('\n').length
      const column = at - before.lastIndexOf('\n')
      const shown = text.split('\n')[line - 1] ?? ''
      where = `\n    ${line}번째 줄, ${column}번째 칸 근처:\n    ${shown.trim()}`
    }
    problems.push(
      `${relative}: 파일 형식이 깨졌습니다 (따옴표, 쉼표, 괄호를 확인하세요).${where}`,
    )
    return null
  }
}

function flatten(value, prefix = '', out = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path, out)
    else out.set(path, child)
  }
  return out
}

const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')

const en = load('src/i18n/locales/en.json')
const ko = load('src/i18n/locales/ko.json')

if (en && ko) {
  const english = flatten(en)
  const korean = flatten(ko)
  for (const [key, text] of english) {
    if (!korean.has(key)) {
      problems.push(`ko.json: "${key}" 항목이 없습니다. 지우지 마세요.`)
      continue
    }
    const value = korean.get(key)
    if (typeof text === 'string') {
      if (typeof value !== 'string' || value.trim() === '') {
        problems.push(`ko.json: "${key}" 항목이 비어 있습니다.`)
      } else if (placeholders(text) !== placeholders(value)) {
        problems.push(
          `ko.json: "${key}" — 중괄호 안의 단어는 그대로 두어야 합니다. 필요한 것: {${placeholders(text).replaceAll(',', '}, {') || '없음'}}`,
        )
      }
    }
  }
  for (const key of korean.keys()) {
    if (!english.has(key)) problems.push(`ko.json: "${key}" 항목은 사이트에서 쓰이지 않습니다 (이름이 바뀌었을 수 있습니다).`)
  }
}

const menu = load('src/content/menu.json')
if (menu) {
  for (const dish of menu.dishes ?? []) {
    if (!dish.name?.ko?.trim()) {
      problems.push(`menu.json: ${dish.number}번 메뉴의 한국어 이름이 비어 있습니다.`)
    }
    if (dish.description && !dish.description.ko?.trim()) {
      warnings.push(`menu.json: ${dish.number}번 메뉴에 한국어 설명이 없습니다.`)
    }
  }
}

const categories = load('src/content/categories.json')
if (categories) {
  for (const category of categories.categories ?? []) {
    if (!category.name?.ko?.trim()) {
      problems.push(`categories.json: 분류 "${category.id}"의 한국어 이름이 비어 있습니다.`)
    }
  }
}

const privacy = load('src/content/privacy.json')
if (privacy && !privacy.ko?.sections?.length) problems.push('privacy.json: 한국어 개인정보 처리방침이 비어 있습니다.')

for (const line of warnings) console.log(`주의  ${line}`)
if (problems.length > 0) {
  for (const line of problems) console.log(`오류  ${line}`)
  console.log(`\n오류 ${problems.length}개. 위 내용을 고친 뒤 다시 확인하세요.`)
  process.exit(1)
}
console.log('모든 확인 완료 — 문제가 없습니다.')

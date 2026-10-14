import { Fragment, useMemo, useState } from 'react'
import type { Editing } from './AdminPage'
import { useLocalCopy } from './AdminPage'
import type { DrinkItem, DrinkPrice, DrinkSection, DrinkStep, DrinksMenu } from './api'
import { PhotoPicker } from './PhotoPicker'
import { Amount, Button, Check, Lines, Message, Save, Text } from './ui'
import styles from './admin.module.css'

const LAYOUT_NAMES: Record<DrinkSection['layout'], string> = {
  cards: 'cocktail cards',
  feature: 'with a photograph',
  columns: 'columns of rows',
  wines: 'wine table',
  steps: 'tea you put together',
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

/** Every name in use: drinks and sections share one set, as the pre-order does. */
const idsOf = (drinks: DrinksMenu) => {
  const ids = new Set<string>()
  for (const section of drinks.sections) {
    ids.add(section.id)
    for (const item of section.items ?? []) ids.add(item.id)
    for (const group of section.groups ?? []) for (const item of group.items) ids.add(item.id)
  }
  return ids
}

const priceSummary = (item: DrinkItem) =>
  typeof item.price === 'number'
    ? String(item.price)
    : (item.prices ?? []).map((entry) => [entry.volume, entry.amount, entry.price].filter(Boolean).join(' ')).join(' · ')

const mapItems = (drinks: DrinksMenu, change: (item: DrinkItem) => DrinkItem | null): DrinksMenu => ({
  ...drinks,
  sections: drinks.sections.map((section) => ({
    ...section,
    ...(section.items
      ? { items: section.items.map(change).filter((item): item is DrinkItem => item !== null) }
      : {}),
    ...(section.groups
      ? {
          groups: section.groups.map((group) => ({
            ...group,
            items: group.items.map(change).filter((item): item is DrinkItem => item !== null),
          })),
        }
      : {}),
  })),
})

/**
 * The bar's list, as the panel edits it. The layout of each section is the
 * printed menu's and stays; what is in it — names, descriptions, prices, what
 * is hidden, the photographs — is the restaurant's to change.
 */
export function Drinks({ editing }: { editing: Editing }) {
  const [drinks, setDrinks, dirty, undo] = useLocalCopy(editing.content.drinks)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [failure, setFailure] = useState('')

  const count = useMemo(
    () =>
      drinks.sections.reduce(
        (total, section) =>
          total + (section.items?.length ?? 0) + (section.groups ?? []).reduce((sum, group) => sum + group.items.length, 0),
        0,
      ),
    [drinks],
  )

  const setSection = (id: string, next: Partial<DrinkSection>) =>
    setDrinks({ ...drinks, sections: drinks.sections.map((section) => (section.id === id ? { ...section, ...next } : section)) })

  const setItem = (id: string, next: Partial<DrinkItem>) =>
    setDrinks(mapItems(drinks, (item) => (item.id === id ? { ...item, ...next } : item)))

  const removeItem = (item: DrinkItem) => {
    const label = item.name?.en || item.name?.pl || item.id
    if (!window.confirm(`Remove ${label} from the drinks for good?`)) return
    setDrinks(mapItems(drinks, (one) => (one.id === item.id ? null : one)))
    setOpenItem(null)
  }

  const moveSection = (id: string, by: number) => {
    const at = drinks.sections.findIndex((section) => section.id === id)
    const to = at + by
    if (at < 0 || to < 0 || to >= drinks.sections.length) return
    const sections = [...drinks.sections]
    const [one] = sections.splice(at, 1)
    sections.splice(to, 0, one)
    setDrinks({ ...drinks, sections })
  }

  const moveItem = (list: DrinkItem[], id: string, by: number) => {
    const at = list.findIndex((item) => item.id === id)
    const to = at + by
    if (at < 0 || to < 0 || to >= list.length) return list
    const next = [...list]
    const [one] = next.splice(at, 1)
    next.splice(to, 0, one)
    return next
  }

  const addItem = (section: DrinkSection, groupIndex?: number) => {
    const taken = idsOf(drinks)
    let n = 1
    while (taken.has(`${section.id}-${n}`)) n += 1
    const item: DrinkItem = {
      id: `${section.id}-${n}`,
      name: { en: '' },
      // New drinks start hidden, so nothing half-typed reaches the site.
      hidden: true,
      ...(section.layout === 'wines'
        ? {
            prices: (section.columns ?? []).slice(0, -1).map((column) => ({ id: slug(column) || 'price', volume: column, price: 0 })),
            abv: '',
          }
        : { price: 0 }),
    }
    if (groupIndex === undefined) {
      setSection(section.id, { items: [...(section.items ?? []), item] })
    } else {
      setSection(section.id, {
        groups: (section.groups ?? []).map((group, at) =>
          at === groupIndex ? { ...group, items: [...group.items, item] } : group,
        ),
      })
    }
    setOpenItem(item.id)
  }

  const commit = () => {
    setFailure('')
    editing.save('drinks', drinks).catch((error: unknown) => {
      setFailure(error instanceof Error ? error.message : String(error))
    })
  }

  const save = (
    <Save dirty={dirty} saving={editing.saving} onSave={commit} onUndo={undo} pending={editing.pending.includes('drinks')} />
  )

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Drinks</h1>
        <span className={styles.rowSub}>
          {count} drinks in {drinks.sections.length} sections
        </span>
      </div>

      <p className={styles.note}>
        The sections keep the layout of the printed drinks menu. A new drink starts hidden: fill it in,
        untick “Hidden”, save, then Publish.
      </p>

      {failure && <Message kind="bad">{failure}</Message>}
      {save}

      {drinks.sections.map((section, index) => {
        const open = openSection === section.id
        const items = section.items ?? []
        const groups = section.groups ?? []
        const total = items.length + groups.reduce((sum, group) => sum + group.items.length, 0)
        return (
          <div key={section.id} className={styles.card}>
            <div className={styles.cardHead}>
              <button
                type="button"
                className={styles.rowName}
                onClick={() => setOpenSection(open ? null : section.id)}
                aria-expanded={open}
              >
                {section.title.en || section.title.pl || section.id}
              </button>
              <span className={styles.rowSub}>
                {section.title.pl && section.title.pl !== section.title.en ? `${section.title.pl} · ` : ''}
                {LAYOUT_NAMES[section.layout]}
                {section.layout !== 'steps' ? ` · ${total}` : ''}
              </span>
              {section.hidden && <span className={`${styles.badge} ${styles.warn}`}>hidden</span>}
              <span className={styles.spacer} />
              <Button onClick={() => moveSection(section.id, -1)} title="Move up" disabled={index === 0}>
                ↑
              </Button>
              <Button
                onClick={() => moveSection(section.id, 1)}
                title="Move down"
                disabled={index === drinks.sections.length - 1}
              >
                ↓
              </Button>
              <Button onClick={() => setOpenSection(open ? null : section.id)}>{open ? 'Close' : 'Open'}</Button>
            </div>

            {open && (
              <>
                <div className={styles.langs}>
                  <Text
                    label="Section — English"
                    value={section.title.en ?? ''}
                    onChange={(value) => setSection(section.id, { title: { ...section.title, en: value } })}
                  />
                  <Text
                    label="Section — Polish"
                    lang="pl"
                    value={section.title.pl ?? ''}
                    onChange={(value) => setSection(section.id, { title: { ...section.title, pl: value } })}
                  />
                </div>
                <div className={styles.checks}>
                  <Check
                    label="Hidden from the site"
                    checked={section.hidden === true}
                    onChange={(on) => setSection(section.id, { hidden: on || undefined })}
                  />
                </div>

                {section.layout !== 'cards' && (
                  <PhotoPicker
                    kind="drinks"
                    dishId={section.id}
                    photo={section.photo}
                    onPhoto={(photo) =>
                      setSection(section.id, photo ? { photo, ratio: photo.startsWith('u:') ? 1 : section.ratio } : { photo: undefined })
                    }
                  />
                )}

                {section.layout === 'steps' && (
                  <Steps section={section} onChange={(next) => setSection(section.id, next)} />
                )}

                {section.layout !== 'steps' && groups.length === 0 && (
                  <ItemTable
                    section={section}
                    items={items}
                    openItem={openItem}
                    onOpen={setOpenItem}
                    onMove={(id, by) => setSection(section.id, { items: moveItem(items, id, by) })}
                    renderEditor={(item) => (
                      <ItemEditor
                        section={section}
                        item={item}
                        onChange={(next) => setItem(item.id, next)}
                        onRemove={() => removeItem(item)}
                        footer={save}
                      />
                    )}
                    onAdd={() => addItem(section)}
                  />
                )}

                {groups.map((group, at) => (
                  <div key={at} className={styles.card}>
                    <div className={styles.langs}>
                      <Text
                        label="Group — English"
                        value={group.title.en ?? ''}
                        onChange={(value) =>
                          setSection(section.id, {
                            groups: groups.map((one, i) => (i === at ? { ...one, title: { ...one.title, en: value } } : one)),
                          })
                        }
                      />
                      <Text
                        label="Group — Polish"
                        lang="pl"
                        value={group.title.pl ?? ''}
                        onChange={(value) =>
                          setSection(section.id, {
                            groups: groups.map((one, i) => (i === at ? { ...one, title: { ...one.title, pl: value } } : one)),
                          })
                        }
                      />
                    </div>
                    <ItemTable
                      section={section}
                      items={group.items}
                      openItem={openItem}
                      onOpen={setOpenItem}
                      onMove={(id, by) =>
                        setSection(section.id, {
                          groups: groups.map((one, i) => (i === at ? { ...one, items: moveItem(one.items, id, by) } : one)),
                        })
                      }
                      renderEditor={(item) => (
                        <ItemEditor
                          section={section}
                          item={item}
                          fallbackName={group.title}
                          onChange={(next) => setItem(item.id, next)}
                          onRemove={() => removeItem(item)}
                          footer={save}
                        />
                      )}
                      onAdd={() => addItem(section, at)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )
      })}

      {save}
    </>
  )
}

function ItemTable({
  section,
  items,
  openItem,
  onOpen,
  onMove,
  renderEditor,
  onAdd,
}: {
  section: DrinkSection
  items: DrinkItem[]
  openItem: string | null
  onOpen: (id: string | null) => void
  onMove: (id: string, by: number) => void
  renderEditor: (item: DrinkItem) => React.ReactNode
  onAdd: () => void
}) {
  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Drink</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <Fragment key={item.id}>
              <tr
                data-open={item.id === openItem || undefined}
                onClick={(event) => {
                  if ((event.target as Element).closest('button')) return
                  onOpen(item.id === openItem ? null : item.id)
                }}
              >
                <td>
                  <button
                    type="button"
                    className={styles.rowName}
                    onClick={() => onOpen(item.id === openItem ? null : item.id)}
                  >
                    {item.name?.en || item.name?.pl || item.volume || '(no name yet)'}
                  </button>
                  <div className={styles.rowSub}>{item.name?.pl && item.name.pl !== item.name.en ? item.name.pl : ''}</div>
                </td>
                <td className={styles.price}>{priceSummary(item)}</td>
                <td>
                  <div className={styles.badges}>
                    {item.hidden && <span className={`${styles.badge} ${styles.warn}`}>hidden</span>}
                    {section.layout === 'cards' && !item.photo && <span className={styles.badge}>no photo</span>}
                    {item.volume && <span className={styles.badge}>{item.volume}</span>}
                  </div>
                </td>
                <td>
                  <div className={styles.tools}>
                    <Button onClick={() => onMove(item.id, -1)} title="Move up">
                      ↑
                    </Button>
                    <Button onClick={() => onMove(item.id, 1)} title="Move down">
                      ↓
                    </Button>
                  </div>
                </td>
              </tr>
              {item.id === openItem && (
                <tr className={styles.editorRow}>
                  <td className={styles.editorCell} colSpan={4}>
                    {renderEditor(item)}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      <div className={styles.tools}>
        <Button onClick={onAdd}>Add a drink here</Button>
      </div>
    </>
  )
}

function ItemEditor({
  section,
  item,
  fallbackName,
  onChange,
  onRemove,
  footer,
}: {
  section: DrinkSection
  item: DrinkItem
  fallbackName?: { pl?: string; en?: string }
  onChange: (next: Partial<DrinkItem>) => void
  onRemove: () => void
  footer: React.ReactNode
}) {
  const variants = item.prices ?? []
  const setVariant = (at: number, next: Partial<DrinkPrice>) =>
    onChange({ prices: variants.map((entry, i) => (i === at ? { ...entry, ...next } : entry)) })

  const addVariant = () => {
    const taken = new Set(variants.map((entry) => entry.id))
    let n = variants.length + 1
    while (taken.has(`option-${n}`)) n += 1
    const next = [...variants, { id: `option-${n}`, price: 0 }]
    // A drink sold one way or the other has its price in the options only.
    onChange({ prices: next, price: undefined })
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>{item.name?.en || item.name?.pl || fallbackName?.en || 'New drink'}</h2>
        <Button kind="danger" onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className={styles.langs}>
        <Text
          label="Name — English"
          value={item.name?.en ?? ''}
          onChange={(value) => onChange({ name: { ...item.name, en: value } })}
          hint={!item.name && fallbackName ? `Empty: shown as ${fallbackName.en ?? ''}` : undefined}
        />
        <Text
          label="Name — Polish"
          lang="pl"
          value={item.name?.pl ?? ''}
          onChange={(value) => onChange({ name: { ...item.name, pl: value } })}
          hint="Leave empty when the name is the same in Polish."
        />
      </div>

      <div className={styles.langs}>
        <Lines
          label="Description — English"
          value={item.desc?.en ?? ''}
          onChange={(value) => onChange({ desc: { ...item.desc, en: value } })}
        />
        <Lines
          label="Description — Polish"
          lang="pl"
          value={item.desc?.pl ?? ''}
          onChange={(value) => onChange({ desc: { ...item.desc, pl: value } })}
        />
      </div>

      {(section.layout === 'feature' || item.note) && (
        <div className={styles.langs}>
          <Text
            label="Small note — English"
            value={item.note?.en ?? ''}
            onChange={(value) => onChange({ note: { ...item.note, en: value } })}
            hint="Above the description, e.g. “Flavours:” or the brand."
          />
          <Text
            label="Small note — Polish"
            lang="pl"
            value={item.note?.pl ?? ''}
            onChange={(value) => onChange({ note: { ...item.note, pl: value } })}
          />
        </div>
      )}

      <div className={styles.row}>
        {section.layout !== 'wines' && (
          <Text
            label="Volume"
            value={item.volume ?? ''}
            onChange={(value) => onChange({ volume: value || undefined })}
            hint="As printed: 500 ml, 0,25 l. Leave empty if the menu does not say."
          />
        )}
        {variants.length === 0 && (
          <Amount label="Price in PLN" value={item.price} onChange={(value) => onChange({ price: value })} />
        )}
        {section.layout === 'wines' && (
          <Text label="Alcohol" value={item.abv ?? ''} onChange={(value) => onChange({ abv: value || undefined })} hint="As printed: 13,5%" />
        )}
      </div>

      {(variants.length > 0 || section.layout !== 'wines') && (
        <div>
          <p className={styles.label}>
            {variants.length > 0 ? 'Sold as' : 'Sold more than one way (a glass and a bottle, shots)?'}
          </p>
          {variants.map((entry, at) => (
            <div key={entry.id} className={styles.row}>
              <Text
                label="Label — English"
                value={entry.label?.en ?? ''}
                onChange={(value) => setVariant(at, { label: { ...entry.label, en: value } })}
              />
              <Text
                label="Label — Polish"
                lang="pl"
                value={entry.label?.pl ?? ''}
                onChange={(value) => setVariant(at, { label: { ...entry.label, pl: value } })}
              />
              <Text label="Volume" value={entry.volume ?? ''} onChange={(value) => setVariant(at, { volume: value || undefined })} />
              <Text
                label="How many"
                value={entry.amount ?? ''}
                onChange={(value) => setVariant(at, { amount: value || undefined })}
                hint="e.g. 3 shots"
              />
              <Amount label="Price in PLN" value={entry.price} onChange={(value) => setVariant(at, { price: value ?? 0 })} />
              <div className={styles.tools}>
                <Button
                  onClick={() => {
                    const rest = variants.filter((_, i) => i !== at)
                    onChange(rest.length ? { prices: rest } : { prices: undefined, price: entry.price })
                  }}
                >
                  Remove this option
                </Button>
              </div>
            </div>
          ))}
          <div className={styles.tools}>
            <Button onClick={addVariant}>{variants.length > 0 ? 'Add another option' : 'Split into options'}</Button>
          </div>
        </div>
      )}

      {(section.layout === 'cards' || item.photo) && (
        <PhotoPicker
          kind="drinks"
          dishId={item.id}
          photo={item.photo}
          onPhoto={(photo) => onChange(photo ? { photo, ratio: photo.startsWith('u:') ? 1 : item.ratio } : { photo: undefined, ratio: undefined })}
        />
      )}

      <div className={styles.checks}>
        <Check label="Hidden from the site" checked={item.hidden === true} onChange={(on) => onChange({ hidden: on || undefined })} />
      </div>

      {footer}
    </div>
  )
}

/** The tea you put together: one price, and the steps as lines. */
function Steps({ section, onChange }: { section: DrinkSection; onChange: (next: Partial<DrinkSection>) => void }) {
  const steps = section.steps ?? []
  const setStep = (at: number, next: Partial<DrinkStep>) =>
    onChange({ steps: steps.map((step, i) => (i === at ? { ...step, ...next } : step)) })

  return (
    <>
      <div className={styles.row}>
        <Amount label="Price in PLN" value={section.price} onChange={(value) => onChange({ price: value ?? 0 })} />
      </div>
      {steps.map((step, at) => (
        <div key={at} className={styles.card}>
          <p className={styles.label}>Step {step.step ?? at + 1}</p>
          <div className={styles.langs}>
            <Text
              label="Title — English"
              value={step.title?.en ?? ''}
              onChange={(value) => setStep(at, { title: { ...step.title, en: value } })}
            />
            <Text
              label="Title — Polish"
              lang="pl"
              value={step.title?.pl ?? ''}
              onChange={(value) => setStep(at, { title: { ...step.title, pl: value } })}
            />
          </div>
          <div className={styles.langs}>
            <Lines
              label="Lines — English"
              value={(step.desc?.en ?? []).join('\n')}
              onChange={(value) => setStep(at, { desc: { ...step.desc, en: value.split('\n') } })}
              hint="One line per row, as on the menu."
            />
            <Lines
              label="Lines — Polish"
              lang="pl"
              value={(step.desc?.pl ?? []).join('\n')}
              onChange={(value) => setStep(at, { desc: { ...step.desc, pl: value.split('\n') } })}
            />
          </div>
        </div>
      ))}
    </>
  )
}

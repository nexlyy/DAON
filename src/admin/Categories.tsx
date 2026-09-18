import { useState } from 'react'
import type { Editing } from './AdminPage'
import { useLocalCopy } from './AdminPage'
import type { Category } from './api'
import { Button, Field, Message, Save, Text } from './ui'
import styles from './admin.module.css'

// The brush drawings that sit behind a category on the site. They are files in
// the build, so the panel offers the ones that exist rather than a free field.
const CALLIGRAPHY = [
  'anju',
  'bbq',
  'chucheon',
  'daon',
  'hansang',
  'jeongol',
  'jungsik',
  'kimbap',
  'ramyeon',
  'siksa',
  'teukseon',
  'yeoreum',
]

export function Categories({ editing }: { editing: Editing }) {
  const [copy, setCopy, dirty, undo] = useLocalCopy(editing.content.categories)
  const [failure, setFailure] = useState('')

  const dishesIn = (id: string) =>
    editing.content.menu.dishes.filter((dish) => dish.categoryId === id).length

  const change = (id: string, next: Partial<Category>) => {
    setCopy({
      categories: copy.categories.map((one) => (one.id === id ? { ...one, ...next } : one)),
    })
  }

  const move = (id: string, by: number) => {
    const at = copy.categories.findIndex((one) => one.id === id)
    const to = at + by
    if (at < 0 || to < 0 || to >= copy.categories.length) return
    const categories = [...copy.categories]
    const [one] = categories.splice(at, 1)
    categories.splice(to, 0, one)
    setCopy({ categories })
  }

  const remove = (category: Category) => {
    const count = dishesIn(category.id)
    if (count > 0) {
      setFailure(
        `${category.name.en} still holds ${count} dishes. Move them to another category first.`,
      )
      return
    }
    if (!window.confirm(`Remove the category ${category.name.en}?`)) return
    setCopy({ categories: copy.categories.filter((one) => one.id !== category.id) })
  }

  const commit = () => {
    setFailure('')
    editing.save('categories', copy).catch((error: unknown) => {
      setFailure(error instanceof Error ? error.message : String(error))
    })
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Categories</h1>
        <span className={styles.rowSub}>in the order the menu shows them</span>
      </div>

      {failure && <Message kind="bad">{failure}</Message>}
      <Save
          dirty={dirty}
          saving={editing.saving}
          onSave={commit}
          onUndo={undo}
          pending={editing.pending.includes('categories')}
        />

      {copy.categories.map((category) => (
        <div key={category.id} className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>{category.name.en || category.id}</h2>
            <div className={styles.tools}>
              <span className={styles.rowSub}>{dishesIn(category.id)} dishes</span>
              <Button onClick={() => move(category.id, -1)} title="Move up">
                ↑
              </Button>
              <Button onClick={() => move(category.id, 1)} title="Move down">
                ↓
              </Button>
              <Button kind="danger" onClick={() => remove(category)}>
                Remove
              </Button>
            </div>
          </div>

          <div className={styles.langs}>
            <Text
              label="Name — English"
              value={category.name.en}
              onChange={(value) => change(category.id, { name: { ...category.name, en: value } })}
            />
            <Text
              label="Name — Polish"
              value={category.name.pl ?? ''}
              lang="pl"
              onChange={(value) => change(category.id, { name: { ...category.name, pl: value } })}
            />
            <Text
              label="Name — Korean"
              value={category.name.ko ?? ''}
              lang="ko"
              onChange={(value) => change(category.id, { name: { ...category.name, ko: value } })}
            />
          </div>

          <div className={styles.row}>
            <Text
              label="In Latin letters"
              value={category.romanization}
              onChange={(value) => change(category.id, { romanization: value })}
              hint="How the Korean name is read aloud."
            />
            <Field label="Brush drawing">
              <select
                className={styles.select}
                value={category.calligraphy}
                onChange={(event) => change(category.id, { calligraphy: event.target.value })}
              >
                {CALLIGRAPHY.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Text
              label="Pages in the printed menu"
              value={category.sourcePages.join(', ')}
              onChange={(value) =>
                change(category.id, {
                  sourcePages: value
                    .split(/[,\s]+/)
                    .map((one) => Number(one))
                    .filter((one) => Number.isFinite(one) && one > 0),
                })
              }
              hint="Only a note for the kitchen; it is not shown to guests."
            />
          </div>
        </div>
      ))}

      <div className={styles.tools}>
        <Button
          onClick={() => {
            const id = `category-${copy.categories.length + 1}`
            setCopy({
              categories: [
                ...copy.categories,
                { id, romanization: '', name: { en: '' }, calligraphy: 'daon', sourcePages: [] },
              ],
            })
          }}
        >
          Add a category
        </Button>
      </div>
    </>
  )
}

import { useMemo, useState } from 'react'
import type { Editing } from './AdminPage'
import { useLocalCopy } from './AdminPage'
import type { Dish } from './api'
import { PhotoPicker } from './PhotoPicker'
import { Button, Check, Field, Lines, Message, Save, Text } from './ui'
import styles from './admin.module.css'

const TAGS: [string, string][] = [
  ['vegetarian', 'Vegetarian'],
  ['extraSpicy', 'Extra spicy'],
  ['mildAvailable', 'Mild on request'],
  ['sharing', 'For sharing'],
]

const fold = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l')

const slug = (value: string) =>
  fold(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

const nextNumber = (dishes: Dish[]) => {
  const highest = dishes.reduce((top, dish) => Math.max(top, Number(dish.number) || 0), 0)
  return String(highest + 1).padStart(2, '0')
}

export function Dishes({ editing }: { editing: Editing }) {
  const [menu, setMenu, dirty, undo] = useLocalCopy(editing.content.menu)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [withHidden, setWithHidden] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [failure, setFailure] = useState('')

  const categories = editing.content.categories.categories
  const nameOf = (id: string) => categories.find((one) => one.id === id)?.name.en ?? id
  const tracked = editing.content.allergens.tracked

  const shown = useMemo(() => {
    const needle = fold(query.trim())
    return menu.dishes.filter((dish) => {
      if (category && dish.categoryId !== category) return false
      if (!withHidden && dish.hidden) return false
      if (!needle) return true
      const haystack = [
        dish.number,
        dish.name.en,
        dish.name.pl ?? '',
        dish.name.ko ?? '',
        dish.description?.en ?? '',
        dish.description?.pl ?? '',
      ].join(' ')
      return fold(haystack).includes(needle)
    })
  }, [menu, query, category, withHidden])

  const change = (id: string, next: Partial<Dish>) => {
    setMenu({
      dishes: menu.dishes.map((dish) => (dish.id === id ? { ...dish, ...next } : dish)),
    })
  }

  const move = (id: string, by: number) => {
    const at = menu.dishes.findIndex((dish) => dish.id === id)
    const to = at + by
    if (at < 0 || to < 0 || to >= menu.dishes.length) return
    const dishes = [...menu.dishes]
    const [one] = dishes.splice(at, 1)
    dishes.splice(to, 0, one)
    setMenu({ dishes })
  }

  const add = () => {
    const number = nextNumber(menu.dishes)
    const dish: Dish = {
      id: `dish-${number}`,
      number,
      categoryId: category || categories[0]?.id || '',
      name: { en: '' },
      price: 0,
      hidden: true,
    }
    setMenu({ dishes: [...menu.dishes, dish] })
    setOpenId(dish.id)
  }

  const remove = (dish: Dish) => {
    const label = dish.name.en || dish.number
    if (!window.confirm(`Remove ${dish.number} ${label} from the menu for good?`)) return
    setMenu({ dishes: menu.dishes.filter((one) => one.id !== dish.id) })
    setOpenId(null)
  }

  const commit = () => {
    setFailure('')
    editing.save('menu', menu).catch((error: unknown) => {
      setFailure(error instanceof Error ? error.message : String(error))
    })
  }

  const open = menu.dishes.find((dish) => dish.id === openId) ?? null

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Dishes</h1>
        <span className={styles.rowSub}>
          {shown.length === menu.dishes.length
            ? `${menu.dishes.length} on the menu`
            : `${shown.length} of ${menu.dishes.length}`}
        </span>
      </div>

      {failure && <Message kind="bad">{failure}</Message>}

      <div className={styles.tools}>
        <input
          className={styles.input}
          style={{ maxWidth: '16rem' }}
          type="search"
          value={query}
          placeholder="Search a name, a number, an ingredient"
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className={styles.select}
          style={{ maxWidth: '14rem' }}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Every category</option>
          {categories.map((one) => (
            <option key={one.id} value={one.id}>
              {one.name.en}
            </option>
          ))}
        </select>
        <Check label="Show hidden" checked={withHidden} onChange={setWithHidden} />
        <span className={styles.spacer} />
        <Button onClick={add}>Add a dish</Button>
      </div>

      <Save dirty={dirty} saving={editing.saving} onSave={commit} onUndo={undo} />

      <table className={styles.table}>
        <thead>
          <tr>
            <th>No.</th>
            <th>Name</th>
            <th>Category</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shown.map((dish) => (
            <tr key={dish.id} data-open={dish.id === openId}>
              <td className={styles.num}>{dish.number}</td>
              <td>
                <button
                  type="button"
                  className={styles.rowName}
                  onClick={() => setOpenId(dish.id === openId ? null : dish.id)}
                >
                  {dish.name.en || '(no name yet)'}
                </button>
                <div className={styles.rowSub}>{dish.name.pl ?? ''}</div>
              </td>
              <td className={styles.rowSub}>{nameOf(dish.categoryId)}</td>
              <td className={styles.price}>{dish.price}</td>
              <td>
                <div className={styles.badges}>
                  {dish.hidden && <span className={`${styles.badge} ${styles.warn}`}>hidden</span>}
                  {dish.featured && <span className={styles.badge}>on the home page</span>}
                  {!dish.photo && <span className={styles.badge}>no photo</span>}
                  {!dish.name.ko && <span className={styles.badge}>no Korean</span>}
                  {(dish.allergens ?? []).map((one) => (
                    <span key={one} className={styles.badge}>
                      {one}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div className={styles.tools}>
                  <Button onClick={() => move(dish.id, -1)} title="Move up">
                    ↑
                  </Button>
                  <Button onClick={() => move(dish.id, 1)} title="Move down">
                    ↓
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>
              {open.number} · {open.name.en || 'New dish'}
            </h2>
            <Button kind="danger" onClick={() => remove(open)}>
              Remove
            </Button>
          </div>

          <div className={styles.row}>
            <Text
              label="Number"
              value={open.number}
              onChange={(value) => change(open.id, { number: value.trim() })}
              hint="As printed on the menu."
            />
            <Field label="Category">
              <select
                className={styles.select}
                value={open.categoryId}
                onChange={(event) => change(open.id, { categoryId: event.target.value })}
              >
                {categories.map((one) => (
                  <option key={one.id} value={one.id}>
                    {one.name.en}
                  </option>
                ))}
              </select>
            </Field>
            <Text
              label={`Price in ${editing.content.restaurant.place.currency}`}
              value={String(open.price)}
              onChange={(value) => change(open.id, { price: Number(value.replace(',', '.')) || 0 })}
            />
            <Text
              label="Portion"
              value={open.portion ?? ''}
              onChange={(value) => change(open.id, { portion: value || undefined })}
              hint="For example 150g. Leave empty if the menu does not say."
            />
            <Text
              label="Serves"
              value={open.serves ?? ''}
              onChange={(value) => change(open.id, { serves: value || undefined })}
              hint="For example 2-3 people."
            />
          </div>

          <PhotoPicker
            dishId={open.id}
            photo={open.photo}
            onPhoto={(photo) => change(open.id, { photo: photo || undefined })}
          />

          <div className={styles.langs}>
            <Text
              label="Name — English"
              value={open.name.en}
              onChange={(value) => change(open.id, { name: { ...open.name, en: value } })}
            />
            <Text
              label="Name — Polish"
              value={open.name.pl ?? ''}
              lang="pl"
              onChange={(value) => change(open.id, { name: { ...open.name, pl: value } })}
            />
            <Text
              label="Name — Korean"
              value={open.name.ko ?? ''}
              lang="ko"
              onChange={(value) => change(open.id, { name: { ...open.name, ko: value } })}
            />
          </div>

          <div className={styles.langs}>
            <Lines
              label="Description — English"
              value={open.description?.en ?? ''}
              onChange={(value) =>
                change(open.id, { description: { ...open.description, en: value } })
              }
            />
            <Lines
              label="Description — Polish"
              value={open.description?.pl ?? ''}
              lang="pl"
              onChange={(value) =>
                change(open.id, { description: { ...open.description, pl: value } })
              }
            />
            <Lines
              label="Description — Korean"
              value={open.description?.ko ?? ''}
              lang="ko"
              onChange={(value) =>
                change(open.id, { description: { ...open.description, ko: value } })
              }
            />
          </div>

          <div>
            <p className={styles.label}>On the plate</p>
            <div className={styles.checks}>
              {TAGS.map(([tag, label]) => (
                <Check
                  key={tag}
                  label={label}
                  checked={(open.tags ?? []).includes(tag)}
                  onChange={(on) =>
                    change(open.id, {
                      tags: on
                        ? [...(open.tags ?? []), tag]
                        : (open.tags ?? []).filter((one) => one !== tag),
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <p className={styles.label}>Allergens the kitchen marks for this dish</p>
            <div className={styles.checks}>
              {tracked.map((one) => (
                <Check
                  key={one}
                  label={one}
                  checked={(open.allergens ?? []).includes(one)}
                  onChange={(on) =>
                    change(open.id, {
                      allergens: on
                        ? [...(open.allergens ?? []), one]
                        : (open.allergens ?? []).filter((each) => each !== one),
                    })
                  }
                />
              ))}
            </div>
            <p className={styles.note}>
              {editing.content.allergens.widespread.join(', ')} are in nearly every dish, so the
              menu says that once instead of on each card.
            </p>
          </div>

          <div className={styles.checks}>
            <Check
              label="Show on the home page"
              checked={open.featured === true}
              onChange={(on) => change(open.id, { featured: on || undefined })}
            />
            <Check
              label="Hidden from the menu"
              checked={open.hidden === true}
              onChange={(on) => change(open.id, { hidden: on || undefined })}
            />
          </div>

          <Field label="Address on the site" hint="Changing this changes the link to the dish.">
            <input
              className={styles.input}
              value={open.id}
              onChange={(event) => {
                const id = slug(event.target.value)
                setMenu({
                  dishes: menu.dishes.map((dish) => (dish.id === open.id ? { ...dish, id } : dish)),
                })
                setOpenId(id)
              }}
            />
          </Field>

          <Save dirty={dirty} saving={editing.saving} onSave={commit} onUndo={undo} />
        </div>
      )}
    </>
  )
}

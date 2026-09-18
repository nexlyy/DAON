/**
 * The panel the restaurant edits its own site from.
 *
 * Everything is edited as a draft: nothing a guest can see changes until
 * Publish is pressed, which is also the only moment the pages are written
 * again. That way a half-finished price or a description mid-sentence never
 * reaches the site, and every publish is one point to go back to.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, api, type Content, type ContentFile, type State } from './api'
import { Categories } from './Categories'
import { Dishes } from './Dishes'
import { Promotion } from './Promotion'
import { Restaurant } from './Restaurant'
import { Texts } from './Texts'
import { Button, Message, Text } from './ui'
import styles from './admin.module.css'

type Section =
  | 'dishes'
  | 'categories'
  | 'restaurant'
  | 'promotion'
  | 'texts'
  | 'history'
  | 'settings'

export interface Editing {
  content: Content
  revision: number
  pending: ContentFile[]
  save: <K extends ContentFile>(file: K, value: Content[K]) => Promise<void>
  saving: boolean
}

export default function AdminPage() {
  const [state, setState] = useState<State | null>(null)
  const [content, setContent] = useState<Content | null>(null)
  const [ready, setReady] = useState(false)
  const [section, setSection] = useState<Section>('dishes')
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')
  const [done, setDone] = useState('')

  useEffect(() => {
    document.title = 'DAON admin'
    // The shell keeps the page hidden until something has rendered into it.
    document.documentElement.removeAttribute('data-boot')
  }, [])

  const load = useCallback(async () => {
    try {
      const fresh = await api.content()
      setState(fresh)
      if (fresh.draft) setContent(fresh.draft)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        setFailure(error instanceof Error ? error.message : String(error))
      }
      setState(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(
    async <K extends ContentFile>(file: K, value: Content[K]) => {
      if (!state) return
      setSaving(true)
      setFailure('')
      setDone('')
      try {
        const next = await api.save(file, value, state.meta.revision)
        setState((was) => (was ? { ...was, ...next } : next))
        setContent((was) => (was ? { ...was, [file]: next.value } : was))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setFailure(message)
        if (error instanceof ApiError && error.status === 409) await load()
        throw error
      } finally {
        setSaving(false)
      }
    },
    [state, load],
  )

  if (!ready) return <div className={styles.shell} />

  if (!state?.user) {
    return <SignIn onIn={load} note={failure} />
  }

  if (state.mustChange) {
    return <FirstPassword state={state} onDone={load} />
  }

  const editing: Editing | null = content
    ? { content, revision: state.meta.revision, pending: state.pending, save, saving }
    : null

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <span className={styles.mark}>DAON</span>
        {state.pending.length > 0 ? (
          <span className={styles.pending}>
            {state.pending.length === 1
              ? '1 change waiting to be published'
              : `${state.pending.length} changes waiting to be published`}
          </span>
        ) : (
          <span className={styles.clean}>the site shows everything saved here</span>
        )}
        <span className={styles.spacer} />
        <PublishBar state={state} onChanged={load} onFailure={setFailure} onDone={setDone} />
        <span className={styles.who}>{state.user}</span>
        <Button
          onClick={() => {
            void api.signOut().then(() => {
              setState(null)
              setContent(null)
            })
          }}
        >
          Sign out
        </Button>
      </header>

      <div className={styles.body}>
        <nav className={styles.nav}>
          {(
            [
              ['dishes', 'Dishes', content?.menu.dishes.length],
              ['categories', 'Categories', content?.categories.categories.length],
              ['restaurant', 'Hours & place', undefined],
              ['promotion', 'Promotion', undefined],
              ['texts', 'Wording', undefined],
              ['history', 'History', undefined],
              ['settings', 'Password & log', undefined],
            ] as [Section, string, number | undefined][]
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              className={styles.navItem}
              aria-current={section === id}
              onClick={() => setSection(id)}
            >
              <span>{label}</span>
              {count !== undefined && <span className={styles.navCount}>{count}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.panel}>
          {failure && <Message kind="bad">{failure}</Message>}
          {done && <Message kind="good">{done}</Message>}

          {editing && section === 'dishes' && <Dishes editing={editing} />}
          {editing && section === 'categories' && <Categories editing={editing} />}
          {editing && section === 'restaurant' && <Restaurant editing={editing} />}
          {editing && section === 'promotion' && <Promotion editing={editing} />}
          {editing && section === 'texts' && <Texts editing={editing} />}
          {section === 'history' && <History onChanged={load} />}
          {section === 'settings' && <Settings state={state} />}
        </div>
      </div>
    </div>
  )
}

function SignIn({ onIn, note }: { onIn: () => Promise<void>; note: string }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [failure, setFailure] = useState(note)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setFailure('')
    try {
      await api.signIn(user.trim(), password)
      await onIn()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const minutes = error instanceof ApiError ? error.retryInMinutes : undefined
      setFailure(minutes ? `${message} — try again in ${minutes} minutes.` : message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.login}>
      <form
        className={styles.loginCard}
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <p className={styles.loginTitle}>DAON</p>
        {failure && <Message kind="bad">{failure}</Message>}
        <Text label="User" value={user} onChange={setUser} />
        <Text label="Password" value={password} onChange={setPassword} type="password" />
        <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={busy}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

/**
 * The first password was typed into a note somewhere to get here. Nothing on
 * the site can be touched until it has been replaced.
 */
function FirstPassword({ state, onDone }: { state: State; onDone: () => Promise<void> }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (next !== again) {
      setFailure('The two new passwords are not the same.')
      return
    }
    setBusy(true)
    setFailure('')
    try {
      await api.changePassword(current, next)
      await onDone()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.login}>
      <form
        className={styles.loginCard}
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <p className={styles.loginTitle}>Set a password</p>
        <Message kind="info">
          {state.user} is signed in with the password this panel was set up with. Until it is
          replaced, the panel can look but not change anything.
        </Message>
        {failure && <Message kind="bad">{failure}</Message>}
        <Text label="Current password" value={current} onChange={setCurrent} type="password" />
        <Text
          label="New password"
          value={next}
          onChange={setNext}
          type="password"
          hint="At least 10 characters."
        />
        <Text label="New password again" value={again} onChange={setAgain} type="password" />
        <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={busy}>
          {busy ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </div>
  )
}

function PublishBar({
  state,
  onChanged,
  onFailure,
  onDone,
}: {
  state: State
  onChanged: () => Promise<void>
  onFailure: (message: string) => void
  onDone: (message: string) => void
}) {
  const [busy, setBusy] = useState('')

  const run = async (what: 'check' | 'publish') => {
    setBusy(what)
    onFailure('')
    onDone('')
    try {
      if (what === 'check') {
        const report = await api.check()
        onDone(`Everything holds together — ${report.pages} pages render in ${(report.ms / 1000).toFixed(1)}s.`)
      } else {
        const report = await api.publish()
        onDone(
          `Published. ${report.pages} pages written in ${(report.ms / 1000).toFixed(1)}s — the site shows it now.`,
        )
        await onChanged()
      }
    } catch (error) {
      onFailure(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy('')
    }
  }

  const nothing = state.pending.length === 0

  return (
    <div className={styles.tools}>
      <Button onClick={() => void run('check')} disabled={busy !== '' || !state.canRender}>
        {busy === 'check' ? 'Checking…' : 'Check'}
      </Button>
      <Button
        kind="primary"
        disabled={busy !== '' || nothing || !state.canRender}
        title={state.canRender ? undefined : 'The server cannot render pages yet'}
        onClick={() => {
          const list = state.pending.join(', ')
          if (!window.confirm(`Put the changes to ${list} on daon.pl now?`)) return
          void run('publish')
        }}
      >
        {busy === 'publish' ? 'Publishing…' : 'Publish'}
      </Button>
    </div>
  )
}

function History({ onChanged }: { onChanged: () => Promise<void> }) {
  const [versions, setVersions] = useState<{ version: string; at: string | null; by: string | null }[]>(
    [],
  )
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .history()
      .then((found) => setVersions(found.versions))
      .catch((error) => setFailure(error instanceof Error ? error.message : String(error)))
  }, [])

  const when = (value: string | null, version: string) => {
    const at = value ? new Date(value) : new Date(version.replace(/-/g, (m, i) => (i > 9 ? ':' : m)))
    return Number.isNaN(at.getTime()) ? version : at.toLocaleString()
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>History</h1>
      </div>
      <p className={styles.note}>
        Every publish keeps the content as it stood before it. Bringing one back puts it into the
        draft, where it can be looked at and published like any other change.
      </p>
      {failure && <Message kind="bad">{failure}</Message>}
      {versions.length === 0 && <p className={styles.note}>Nothing has been published from here yet.</p>}
      <div className={styles.list}>
        {versions.map((one) => (
          <div key={one.version} className={styles.entry}>
            <span className={styles.entryWhen}>{when(one.at, one.version)}</span>
            <span className={styles.spacer}>{one.by ?? ''}</span>
            <Button
              disabled={busy}
              onClick={() => {
                if (!window.confirm('Put this version into the draft?')) return
                setBusy(true)
                api
                  .restore(one.version)
                  .then(() => onChanged())
                  .catch((error) =>
                    setFailure(error instanceof Error ? error.message : String(error)),
                  )
                  .finally(() => setBusy(false))
              }}
            >
              Bring back
            </Button>
          </div>
        ))}
      </div>
    </>
  )
}

function Settings({ state }: { state: State }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [failure, setFailure] = useState('')
  const [done, setDone] = useState('')
  const [entries, setEntries] = useState<{ at: string; what: string; user?: string; ip?: string }[]>(
    [],
  )

  useEffect(() => {
    api
      .log(100)
      .then((found) => setEntries(found.entries))
      .catch(() => setEntries([]))
  }, [done])

  const change = async () => {
    setFailure('')
    setDone('')
    if (next !== again) {
      setFailure('The two new passwords are not the same.')
      return
    }
    try {
      await api.changePassword(current, next)
      setCurrent('')
      setNext('')
      setAgain('')
      setDone('The password is changed. Anyone signed in elsewhere has been signed out.')
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Password & log</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Change the password</h2>
          <span className={styles.rowSub}>signed in as {state.user}</span>
        </div>
        {failure && <Message kind="bad">{failure}</Message>}
        {done && <Message kind="good">{done}</Message>}
        <div className={styles.row}>
          <Text label="Current" value={current} onChange={setCurrent} type="password" />
          <Text label="New" value={next} onChange={setNext} type="password" />
          <Text label="New again" value={again} onChange={setAgain} type="password" />
        </div>
        <div className={styles.tools}>
          <Button kind="primary" onClick={() => void change()} disabled={!current || !next}>
            Change
          </Button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>What happened here</h2>
          <span className={styles.rowSub}>most recent first</span>
        </div>
        <div className={styles.list}>
          {entries.map((entry, index) => (
            <div key={`${entry.at}-${index}`} className={styles.entry}>
              <span className={styles.entryWhen}>{new Date(entry.at).toLocaleString()}</span>
              <span className={styles.spacer}>{entry.what}</span>
              <span className={styles.rowSub}>{entry.ip ?? ''}</span>
            </div>
          ))}
          {entries.length === 0 && <p className={styles.note}>Nothing written down yet.</p>}
        </div>
      </div>
    </>
  )
}

/** Shared by the sections: the same value with the locales the site speaks. */
export function useLocalCopy<T>(value: T): [T, (next: T) => void, boolean, () => void] {
  const [copy, setCopy] = useState(value)
  const original = useMemo(() => JSON.stringify(value), [value])

  useEffect(() => {
    setCopy(JSON.parse(original) as T)
  }, [original])

  const dirty = JSON.stringify(copy) !== original
  return [copy, setCopy, dirty, () => setCopy(JSON.parse(original) as T)]
}

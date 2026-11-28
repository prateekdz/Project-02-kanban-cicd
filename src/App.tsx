import { useCallback, useMemo, useState } from 'react'
import { TaskProvider, useTaskContext } from './context/TaskContext'
import { TaskBoard } from './components/TaskBoard/TaskBoard'
import { TaskForm } from './components/TaskBoard/TaskForm'
import { TaskModal } from './components/TaskBoard/TaskModal'
import type { Priority, Status } from './types/tasks'

const STATUSES: Array<{ status: Status; label: string; tone: string }> = [
  { status: 'todo', label: 'To do', tone: 'bg-violet-500' },
  { status: 'inProgress', label: 'In progress', tone: 'bg-sky-500' },
  { status: 'done', label: 'Completed', tone: 'bg-emerald-500' },
]

function Dashboard() {
  const { tasksById, storageError, replaceSavedBoard } = useTaskContext()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const tasks = useMemo(() => Object.values(tasksById), [tasksById])
  const closeTaskModal = useCallback(() => setSelectedTaskId(null), [])

  const taskCounts = useMemo(() => {
    const counts: Record<Status, number> = { todo: 0, inProgress: 0, done: 0 }
    tasks.forEach((task) => {
      counts[task.status] += 1
    })
    return counts
  }, [tasks])

  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <a href="#overview" className="flex items-center gap-3 no-underline">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
                <rect x="3.5" y="4" width="7" height="16" rx="2" fill="currentColor" />
                <rect x="13.5" y="4" width="7" height="10" rx="2" fill="currentColor" opacity=".65" />
                <rect x="13.5" y="16" width="7" height="4" rx="2" fill="currentColor" opacity=".4" />
              </svg>
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight text-slate-900">Boardly</span>
              <span className="hidden text-xs text-slate-500 sm:block">Personal task workspace</span>
            </span>
          </a>
          <nav aria-label="Main navigation" className="flex items-center gap-2">
            <a
              href="#board"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              Board
            </a>
            <a
              href="#new-task"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-indigo-600"
            >
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              <span>New task</span>
            </a>
          </nav>
        </div>
      </header>

      <main id="overview" className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Your workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Keep work moving.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Plan your day, focus on what matters, and move every task forward.
            </p>
          </div>
          <div
            className={[
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
              storageError
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800',
            ].join(' ')}
            role="status"
          >
            <span
              aria-hidden="true"
              className={['size-2 rounded-full', storageError ? 'bg-amber-500' : 'bg-emerald-500'].join(' ')}
            />
            {storageError ? 'Storage needs attention' : 'Saved in this browser'}
          </div>
        </section>

        {storageError ? (
          <div
            className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p>{storageError}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              onClick={replaceSavedBoard}
            >
              Replace saved data with this board
            </button>
          </div>
        ) : null}

        <section aria-label="Task overview" className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">All tasks</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{tasks.length}</p>
            <p className="mt-1 text-xs text-slate-500">Across your whole board</p>
          </article>
          {STATUSES.map(({ status, label, tone }) => (
            <article key={status} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span aria-hidden="true" className={['size-2.5 rounded-full', tone].join(' ')} />
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{taskCounts[status]}</p>
              <p className="mt-1 text-xs text-slate-500">
                {status === 'done' ? 'Nice work getting these done' : 'Tasks in this stage'}
              </p>
            </article>
          ))}
        </section>

        <section id="new-task" className="mb-8 scroll-mt-6">
          <TaskForm />
        </section>

        <section id="board" className="scroll-mt-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Your board</h2>
              <p className="mt-1 text-sm text-slate-500">
                Drag a card to update its status, or open it to edit the details.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block sm:w-64">
                <span className="sr-only">Search tasks</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  aria-label="Search tasks"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search tasks..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </label>
              <label>
                <span className="sr-only">Filter by priority</span>
                <select
                  aria-label="Filter by priority"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value as Priority | 'all')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-44"
                >
                  <option value="all">All priorities</option>
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
              </label>
            </div>
          </div>

          <TaskBoard
            searchQuery={searchQuery}
            priorityFilter={priorityFilter}
            onOpenTask={setSelectedTaskId}
          />
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500">
          Your tasks are stored locally in this browser. They are not synced between devices.
        </footer>
      </main>

      {selectedTaskId ? (
        <TaskModal taskId={selectedTaskId} onClose={closeTaskModal} />
      ) : null}
    </div>
  )
}

export default function App() {
  return (
    <TaskProvider>
      <Dashboard />
    </TaskProvider>
  )
}

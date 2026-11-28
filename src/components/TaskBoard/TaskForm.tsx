import { useState } from 'react'
import type { NewTaskInput, Priority, Status } from '../../types/tasks'
import { useTaskContext } from '../../context/TaskContext'

const STATUSES: Array<{ value: Status; label: string }> = [
  { value: 'todo', label: 'To do' },
  { value: 'inProgress', label: 'In progress' },
  { value: 'done', label: 'Completed' },
]

const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const CONTROL_CLASS =
  'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export function TaskForm() {
  const { addTask } = useTaskContext()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('todo')
  const [tags, setTags] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [deadline, setDeadline] = useState('')

  function reset() {
    setTitle('')
    setDescription('')
    setStatus('todo')
    setTags('')
    setPriority('medium')
    setDeadline('')
  }

  function submit() {
    const normalizedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    const payload: NewTaskInput = {
      title: title.trim(),
      description: description.trim(),
      status,
      tags: normalizedTags,
      priority,
      deadline: deadline || undefined,
    }

    addTask(payload)
    reset()
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (title.trim()) submit()
      }}
    >
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">Create a task</h2>
        <p className="mt-1 text-xs text-slate-500">Add the details now; you can change them any time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={CONTROL_CLASS}
            placeholder="e.g., Write project outline"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Status)}
            className={CONTROL_CLASS}
          >
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={`${CONTROL_CLASS} min-h-[88px] resize-y`}
            placeholder="Add more context (optional)"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Tags</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className={CONTROL_CLASS}
            placeholder="comma, separated"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className={CONTROL_CLASS}
          >
            {PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Deadline (optional)</span>
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className={CONTROL_CLASS}
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row">
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={reset}
        >
          Reset
        </button>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-indigo-600"
        >
          Create Task
        </button>
      </div>
    </form>
  )
}

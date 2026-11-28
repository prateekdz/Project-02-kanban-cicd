/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Priority, Status } from '../../types/tasks'
import { useTaskContext } from '../../context/TaskContext'

type Props = {
  taskId: string
  onClose: () => void
}

function parseTags(input: string) {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high']
const CONTROL_CLASS =
  'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export function TaskModal({ taskId, onClose }: Props) {
  const { tasksById, updateTask } = useTaskContext()
  const task = tasksById[taskId]
  const dialogRef = useRef<HTMLDivElement>(null)

  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('todo')
  const [tagsInput, setTagsInput] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [deadline, setDeadline] = useState('')

  const title = useMemo(() => task?.title ?? '', [task?.title])

  useEffect(() => {
    if (!task) return
    setDescription(task.description)
    setStatus(task.status)
    setTagsInput(task.tags.join(', '))
    setPriority(task.priority)
    setDeadline(task.deadline ?? '')
  }, [taskId, task])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusableElements = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      )

    focusableElements()[0]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = focusableElements()
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose])

  if (!task) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-dialog-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <h2 id="task-dialog-title" className="truncate text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Created {new Date(task.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            aria-label="Close task details"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-slate-700">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={`${CONTROL_CLASS} min-h-[120px] resize-y`}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as Status)}
                className={CONTROL_CLASS}
              >
                <option value="todo">To do</option>
                <option value="inProgress">In progress</option>
                <option value="done">Completed</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Priority</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
                className={CONTROL_CLASS}
              >
                {PRIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-slate-700">Tags</span>
              <input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                className={CONTROL_CLASS}
                placeholder="comma, separated"
              />
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
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 p-5 sm:flex-row">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            onClick={() => {
              updateTask(taskId, {
                description: description.trim(),
                status,
                tags: parseTags(tagsInput),
                priority,
                deadline: deadline || undefined,
                updatedAt: Date.now(),
              })
              onClose()
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

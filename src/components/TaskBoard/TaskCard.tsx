import { Draggable } from 'react-beautiful-dnd'
import type { Task } from '../../types/tasks'

type Props = {
  task: Task
  index: number
  onOpen: (taskId: string) => void
  onDelete: (taskId: string) => void
}

function priorityBadgeClass(priority: Task['priority']) {
  switch (priority) {
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'medium':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'low':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export function TaskCard({ task, index, onOpen, onDelete }: Props) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={[
            'rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-shadow',
            snapshot.isDragging ? 'ring-2 ring-indigo-400 shadow-lg' : 'hover:shadow-md',
          ].join(' ')}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                className="block max-w-full truncate text-left text-sm font-semibold text-slate-900 underline-offset-2 transition hover:text-indigo-700 hover:underline focus-visible:rounded focus-visible:outline-indigo-600"
                onClick={() => onOpen(task.id)}
              >
                {task.title}
              </button>
              {task.description ? (
                <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                  {task.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              {...provided.dragHandleProps}
              className="cursor-grab rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
              aria-label={`Drag ${task.title}`}
              title="Drag to move task"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <circle cx="7" cy="5" r="1.25" />
                <circle cx="13" cy="5" r="1.25" />
                <circle cx="7" cy="10" r="1.25" />
                <circle cx="13" cy="10" r="1.25" />
                <circle cx="7" cy="15" r="1.25" />
                <circle cx="13" cy="15" r="1.25" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span
              className={[
                'rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize',
                priorityBadgeClass(task.priority),
              ].join(' ')}
            >
              {task.priority} priority
            </span>
            {task.deadline ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Due {task.deadline}
              </span>
            ) : null}
            {task.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 4 ? (
              <span className="text-[11px] text-slate-500">+{task.tags.length - 4}</span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span className="text-[11px] text-slate-400">
              Updated {new Date(task.updatedAt).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                onClick={() => onOpen(task.id)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                aria-label={`Delete ${task.title}`}
                onClick={() => onDelete(task.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      )}
    </Draggable>
  )
}


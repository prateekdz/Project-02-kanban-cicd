import { Droppable } from 'react-beautiful-dnd'
import type { Status, Task } from '../../types/tasks'
import { TaskCard } from './TaskCard'

type Props = {
  status: Status
  title: string
  tasks: Task[]
  onOpenTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  hasFilters: boolean
}

const ACCENTS: Record<Status, string> = {
  todo: 'bg-violet-500',
  inProgress: 'bg-sky-500',
  done: 'bg-emerald-500',
}

export function TaskColumn({ status, title, tasks, onOpenTask, onDeleteTask, hasFilters }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className={['size-2.5 rounded-full', ACCENTS[status]].join(' ')} />
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">
          {tasks.length}
        </span>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              'flex min-h-[220px] flex-col gap-3 p-3 transition-colors sm:min-h-[280px]',
              snapshot.isDraggingOver ? 'bg-indigo-50' : 'bg-slate-50/70',
            ].join(' ')}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onOpen={onOpenTask}
                onDelete={onDeleteTask}
              />
            ))}
            {tasks.length === 0 ? (
              <p className="my-auto rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center text-xs leading-5 text-slate-500">
                {hasFilters ? 'No tasks match these filters.' : 'No tasks here yet. Add one above or drag it here.'}
              </p>
            ) : null}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  )
}


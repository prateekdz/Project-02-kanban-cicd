import { useMemo } from 'react'
import { DragDropContext, type DropResult } from 'react-beautiful-dnd'
import { useTaskContext } from '../../context/TaskContext'
import type { Priority, Status, Task } from '../../types/tasks'
import { TaskColumn } from './TaskColumn'

const STATUSES: Array<{ status: Status; title: string }> = [
  { status: 'todo', title: 'To do' },
  { status: 'inProgress', title: 'In progress' },
  { status: 'done', title: 'Completed' },
]

type Props = {
  searchQuery: string
  priorityFilter: Priority | 'all'
  onOpenTask: (taskId: string) => void
}

export function TaskBoard({ searchQuery, priorityFilter, onOpenTask }: Props) {
  const { tasksById, columnOrder, moveTask, deleteTask } = useTaskContext()
  const hasFilters = Boolean(searchQuery.trim()) || priorityFilter !== 'all'

  const tasksByStatus = useMemo(() => {
    const out: Record<Status, Task[]> = {
      todo: [],
      inProgress: [],
      done: [],
    }
    const query = searchQuery.trim().toLocaleLowerCase()

    STATUSES.forEach(({ status }) => {
      const ids = columnOrder[status] ?? []
      out[status] = ids
        .map((id) => tasksById[id])
        .filter((task): task is Task => Boolean(task))
        .filter((task) => {
          const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
          const searchableText = [task.title, task.description, ...task.tags].join(' ').toLocaleLowerCase()
          return matchesPriority && (!query || searchableText.includes(query))
        })
    })

    return out
  }, [columnOrder, priorityFilter, searchQuery, tasksById])

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const destinationStatus = STATUSES.find(({ status }) => status === destination.droppableId)?.status
    if (!destinationStatus) return

    const fullDestinationOrder = columnOrder[destinationStatus].filter((id) => id !== draggableId)
    const visibleDestinationOrder = tasksByStatus[destinationStatus]
      .map((task) => task.id)
      .filter((id) => id !== draggableId)
    const taskBeforeDrop = visibleDestinationOrder[destination.index]
    const fullIndex = taskBeforeDrop
      ? fullDestinationOrder.indexOf(taskBeforeDrop)
      : fullDestinationOrder.length

    moveTask(draggableId, destinationStatus, fullIndex)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {STATUSES.map(({ status, title }) => (
          <TaskColumn
            key={status}
            status={status}
            title={title}
            tasks={tasksByStatus[status]}
            onOpenTask={onOpenTask}
            onDeleteTask={deleteTask}
            hasFilters={hasFilters}
          />
        ))}
      </div>
    </DragDropContext>
  )
}


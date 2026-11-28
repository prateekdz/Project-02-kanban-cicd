import type { Status, Task, TaskPatch } from '../types/tasks'

export type BoardStateV1 = {
  version: 1
  tasksById: Record<string, Task>
  columnOrder: Record<Status, string[]>
}

const STORAGE_KEY = 'kanbanTasksV1'
const STATUSES: Status[] = ['todo', 'inProgress', 'done']
const PRIORITIES = ['low', 'medium', 'high'] as const

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTask(value: unknown, id: string): value is Task {
  if (!isObject(value)) return false
  return (
    value.id === id &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    STATUSES.includes(value.status as Status) &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    PRIORITIES.includes(value.priority as (typeof PRIORITIES)[number]) &&
    (value.deadline === undefined || typeof value.deadline === 'string') &&
    typeof value.createdAt === 'number' &&
    Number.isFinite(value.createdAt) &&
    typeof value.updatedAt === 'number' &&
    Number.isFinite(value.updatedAt)
  )
}

export function defaultBoardState(): BoardStateV1 {
  return {
    version: 1,
    tasksById: {},
    columnOrder: {
      todo: [],
      inProgress: [],
      done: [],
    },
  }
}

export function loadBoardState(): BoardStateV1 {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultBoardState()

  const parsed: unknown = JSON.parse(raw)
  if (!isObject(parsed) || parsed.version !== 1 || !isObject(parsed.tasksById)) {
    throw new Error('Stored task board has an unsupported or invalid format.')
  }

  const tasksById: Record<string, Task> = Object.create(null) as Record<string, Task>
  for (const [id, task] of Object.entries(parsed.tasksById)) {
    if (!isTask(task, id)) throw new Error('Stored task board contains an invalid task.')
    tasksById[id] = task
  }

  if (!isObject(parsed.columnOrder)) {
    throw new Error('Stored task board is missing its column order.')
  }

  const columnOrder = {} as Record<Status, string[]>
  const seen = new Set<string>()
  for (const status of STATUSES) {
    const ids = parsed.columnOrder[status]
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
      throw new Error('Stored task board contains an invalid column.')
    }

    columnOrder[status] = ids
    for (const id of ids) {
      if (seen.has(id) || !tasksById[id] || tasksById[id].status !== status) {
        throw new Error('Stored task board has inconsistent task ordering.')
      }
      seen.add(id)
    }
  }

  if (seen.size !== Object.keys(tasksById).length) {
    throw new Error('Stored task board is missing tasks from its columns.')
  }

  return { version: 1, tasksById, columnOrder }
}

export function saveBoardState(state: BoardStateV1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function normalizeTags(tags: string[]): string[] {
  const deduped = new Set(tags.map((tag) => tag.trim()).filter(Boolean))
  return Array.from(deduped)
}

export function applyPatch(task: Task, patch: TaskPatch): Task {
  return {
    ...task,
    ...patch,
    tags: patch.tags ? normalizeTags(patch.tags) : task.tags,
    updatedAt: patch.updatedAt ?? Date.now(),
  }
}

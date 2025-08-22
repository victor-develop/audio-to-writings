export const queryKeys = {
  recordings: {
    all: ['recordings'] as const,
    lists: () => [...queryKeys.recordings.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.recordings.lists(), userId] as const,
    detail: (id: string) => [...queryKeys.recordings.all, 'detail', id] as const,
  },
  prompts: {
    all: ['prompts'] as const,
    lists: () => [...queryKeys.prompts.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.prompts.lists(), userId] as const,
    detail: (id: string) => [...queryKeys.prompts.all, 'detail', id] as const,
  },
} as const

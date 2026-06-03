export interface MarketFailedTaskCategory<TTaskType extends string = string> {
  label: string;
  count: number;
  taskType: TTaskType;
}

export interface MarketFailedTaskMutation {
  mutateAsync: (params: unknown[]) => Promise<unknown>;
}

export function getFailedTaskActionTypes<TTaskType extends string>(
  categories: readonly MarketFailedTaskCategory<TTaskType>[],
): TTaskType[] {
  return categories
    .filter((category) => category.count > 0)
    .map((category) => category.taskType);
}

export function toFailedTaskDisplayCategories(
  categories: readonly MarketFailedTaskCategory[],
): readonly (readonly [string, number])[] {
  return categories.map(
    (category) => [category.label, category.count] as const,
  );
}

export async function runFailedTaskActions<TTaskType extends string>(
  mutation: MarketFailedTaskMutation,
  categories: readonly MarketFailedTaskCategory<TTaskType>[],
) {
  await Promise.all(
    getFailedTaskActionTypes(categories).map((taskType) =>
      mutation.mutateAsync([taskType]),
    ),
  );
}

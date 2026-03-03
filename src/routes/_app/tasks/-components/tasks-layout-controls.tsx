import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

type SetControlsFn = (node: ReactNode | null) => void;

const TasksLayoutControlsContext = createContext<SetControlsFn | null>(null);

interface TasksLayoutControlsProviderProps {
  children: ReactNode;
  render: (controls: ReactNode | null) => ReactNode;
}

export function TasksLayoutControlsProvider({
  children,
  render,
}: TasksLayoutControlsProviderProps) {
  const [controls, setControls] = useState<ReactNode | null>(null);
  const value = useMemo<SetControlsFn>(() => setControls, []);

  return (
    <TasksLayoutControlsContext.Provider value={value}>
      {render(controls)}
      {children}
    </TasksLayoutControlsContext.Provider>
  );
}

export function useTasksLayoutControls(controls: ReactNode | null) {
  const setControls = useContext(TasksLayoutControlsContext);

  useLayoutEffect(() => {
    if (!setControls) return undefined;
    setControls(controls);
    return () => setControls(null);
  }, [controls, setControls]);
}

import { useState } from 'react';
import type { Task } from '../types';

function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamel(v),
      ])
    );
  }
  return obj;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connected, setConnected] = useState(false);

  const connect = async (apiUrl: string) => {
    const res = await fetch(`${apiUrl}/tasks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setTasks(toCamel(await res.json()));
    setConnected(true);
  };

  return { tasks, connect, connected };
}

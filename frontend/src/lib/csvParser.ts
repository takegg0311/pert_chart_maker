import type { Task } from '../types';

export function parseCSV(text: string): Task[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSVにデータがありません');

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  ['id', 'name', 'duration'].forEach(col => {
    if (!header.includes(col))
      throw new Error(`必須列 "${col}" が見つかりません`);
  });

  return lines.slice(1)
    .filter(line => line.trim())
    .map((line, i) => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      header.forEach((h, j) => { row[h] = values[j] ?? ''; });

      const duration = parseInt(row.duration, 10);
      if (isNaN(duration) || duration <= 0)
        throw new Error(`行 ${i + 2}: duration は1以上の整数が必要です`);
      if (!row.id)
        throw new Error(`行 ${i + 2}: id が空です`);

      return {
        id: row.id,
        name: row.name,
        duration,
        predecessorIds: row.predecessors
          ? row.predecessors.split('|').map(s => s.trim()).filter(Boolean)
          : [],
      };
    });
}

export function validateTasks(tasks: Task[]): string[] {
  const errors: string[] = [];
  const ids = new Set(tasks.map(t => t.id));

  const seen = new Set<string>();
  tasks.forEach(t => {
    if (seen.has(t.id)) errors.push(`id "${t.id}" が重複しています`);
    seen.add(t.id);
  });

  tasks.forEach(t => {
    t.predecessorIds.forEach(pid => {
      if (!ids.has(pid))
        errors.push(`タスク "${t.name}" の predecessor "${pid}" が存在しません`);
    });
  });

  if (hasCycle(tasks)) errors.push('循環依存が検出されました');

  return errors;
}

function hasCycle(tasks: Task[]): boolean {
  const succ: Record<string, string[]> = {};
  tasks.forEach(t => { succ[t.id] = []; });
  tasks.forEach(t => t.predecessorIds.forEach(p => succ[p]?.push(t.id)));

  const visited = new Set<string>(), stack = new Set<string>();
  function dfs(id: string): boolean {
    visited.add(id); stack.add(id);
    for (const s of succ[id]) {
      if (!visited.has(s) && dfs(s)) return true;
      if (stack.has(s)) return true;
    }
    stack.delete(id); return false;
  }
  return tasks.some(t => !visited.has(t.id) && dfs(t.id));
}

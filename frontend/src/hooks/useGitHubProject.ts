import { useState, useCallback } from 'react';
import { validateTasks } from '../lib/csvParser';
import type { GitHubProjectApiResponse, GitHubProjectConfig, Task } from '../types';

function mapToTasks(data: GitHubProjectApiResponse): Task[] {
  return data.tasks.map(task => ({
    id: task.id,
    name: task.name,
    duration: task.duration,
    predecessorIds: task.predecessors,
  }));
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) {
      return body.error;
    }
  } catch {
    // ignore JSON parse errors
  }
  return `取得に失敗しました (HTTP ${res.status})`;
}

export function useGitHubProject() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<GitHubProjectConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async (projectUrl: string, estimateField: string) => {
    const trimmedUrl = projectUrl.trim();
    if (!trimmedUrl) {
      setError('Project URL を入力してください');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = { project_url: trimmedUrl };
      const trimmedField = estimateField.trim();
      if (trimmedField) {
        body.estimate_field = trimmedField;
      }

      const res = await fetch('/api/gh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(await parseErrorMessage(res));
      }

      const data: GitHubProjectApiResponse = await res.json();
      const mapped = mapToTasks(data);
      const validationErrors = validateTasks(mapped);
      if (validationErrors.length) {
        throw new Error(validationErrors.join('\n'));
      }

      setTasks(mapped);
      setConfig({
        projectUrl: trimmedUrl,
        estimateField: trimmedField || 'Estimate',
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '取得に失敗しました';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTasks([]);
    setConfig(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    tasks,
    config,
    loading,
    error,
    fetchProject,
    reset,
  };
}

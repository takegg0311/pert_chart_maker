import { useState, useRef } from 'react';
import { PertGraph } from './components/PertGraph';
import { CPMPanel } from './components/CPMPanel';
import { DurationLegend } from './components/DurationLegend';
import { GitHubProjectForm } from './components/GitHubProjectForm';
import { parseCSV, validateTasks } from './lib/csvParser';
import { useGitHubProject } from './hooks/useGitHubProject';
import type { Task, CPMResult } from './types';
import './App.css';

type Mode = 'idle' | 'csv' | 'github';

function shortenProjectUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, '');
  } catch {
    return url;
  }
}

function App() {
  const [mode, setMode] = useState<Mode>('idle');
  const [csvTasks, setCsvTasks] = useState<Task[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [cpm, setCpm] = useState<CPMResult | null>(null);
  const {
    tasks: githubTasks,
    config: githubConfig,
    loading: githubLoading,
    error: githubError,
    fetchProject,
    reset: resetGitHub,
  } = useGitHubProject();
  const fileRef = useRef<HTMLInputElement>(null);

  const activeTasks = mode === 'csv' ? csvTasks : githubTasks;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const tasks = parseCSV(ev.target!.result as string);
        const errors = validateTasks(tasks);
        if (errors.length) { setCsvError(errors.join('\n')); return; }
        setCsvTasks(tasks);
        setCsvError(null);
        setMode('csv');
      } catch (err: unknown) {
        setCsvError(err instanceof Error ? err.message : 'CSV の読み込みに失敗しました');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleGitHubSubmit = async (projectUrl: string, estimateField: string) => {
    const success = await fetchProject(projectUrl, estimateField);
    if (success) {
      setMode('github');
    }
  };

  const reset = () => {
    setMode('idle');
    setCsvTasks([]);
    setCsvError(null);
    setCpm(null);
    resetGitHub();
  };

  if (mode === 'idle') {
    return (
      <div className="idle-screen">
        <h1>PERT ダイアグラム</h1>
        <div className="mode-cards">
          <div className="card" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} hidden />
            <div className="card-icon">📄</div>
            <h2>CSV を読み込む</h2>
            <p>バックエンド不要・即時描画</p>
            <a href="/template.csv" download onClick={e => e.stopPropagation()}>
              テンプレートをダウンロード
            </a>
          </div>
          <div className="card card--github">
            <div className="card-icon">🐙</div>
            <h2>GitHub Project</h2>
            <p>Project の Issue からタスクを取得</p>
            <GitHubProjectForm
              loading={githubLoading}
              error={githubError}
              onSubmit={handleGitHubSubmit}
            />
          </div>
        </div>
        {csvError && <pre className="error">{csvError}</pre>}
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <span className="mode-badge">
          {mode === 'csv'
            ? '📄 CSV モード'
            : `🐙 ${githubConfig ? shortenProjectUrl(githubConfig.projectUrl) : 'GitHub Project'}`}
        </span>
        {mode === 'csv' && (
          <button onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} hidden />
            CSV を再読み込み
          </button>
        )}
        {mode === 'github' && githubConfig && (
          <button
            disabled={githubLoading}
            onClick={() => fetchProject(githubConfig.projectUrl, githubConfig.estimateField)}
          >
            {githubLoading ? '更新中...' : '更新'}
          </button>
        )}
        <button onClick={reset}>← 戻る</button>
      </header>
      {(csvError || githubError) && (
        <pre className="error">{mode === 'csv' ? csvError : githubError}</pre>
      )}
      <PertGraph tasks={activeTasks} onCpmComputed={setCpm} />
      <DurationLegend />
      {cpm && <CPMPanel cpm={cpm} />}
    </div>
  );
}

export default App;

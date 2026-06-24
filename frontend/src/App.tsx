import { useState, useRef } from 'react';
import { PertGraph } from './components/PertGraph';
import { parseCSV, validateTasks } from './lib/csvParser';
import { useTasks } from './hooks/useTasks';
import type { Task } from './types';
import './App.css';

type Mode = 'idle' | 'csv' | 'backend';

function App() {
  const [mode, setMode] = useState<Mode>('idle');
  const [csvTasks, setCsvTasks] = useState<Task[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('');
  const { tasks: dbTasks, connect } = useTasks();
  const fileRef = useRef<HTMLInputElement>(null);

  const activeTasks = mode === 'csv' ? csvTasks : dbTasks;

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
      } catch (err: any) {
        setCsvError(err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleConnect = async () => {
    const url = prompt('バックエンド API の URL:', 'http://localhost:8000');
    if (!url) return;
    setApiUrl(url);
    try {
      await connect(url);
      setMode('backend');
    } catch {
      alert('接続に失敗しました。URL を確認してください。');
    }
  };

  const reset = () => { setMode('idle'); setCsvTasks([]); setCsvError(null); };

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
          <div className="card" onClick={handleConnect}>
            <div className="card-icon">🗄</div>
            <h2>バックエンドに接続</h2>
            <p>DB からタスクを読み込む</p>
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
          {mode === 'csv' ? '📄 CSV モード' : `🗄 ${apiUrl}`}
        </span>
        {mode === 'csv' && (
          <button onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} hidden />
            CSV を再読み込み
          </button>
        )}
        {mode === 'backend' && (
          <button onClick={() => connect(apiUrl)}>更新</button>
        )}
        <button onClick={reset}>← 戻る</button>
      </header>
      {csvError && <pre className="error">{csvError}</pre>}
      <PertGraph tasks={activeTasks} />
    </div>
  );
}

export default App;

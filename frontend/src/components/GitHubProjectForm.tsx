import { useState, type FormEvent } from 'react';

interface Props {
  loading: boolean;
  error: string | null;
  onSubmit: (projectUrl: string, estimateField: string) => void | Promise<void>;
}

export function GitHubProjectForm({ loading, error, onSubmit }: Props) {
  const [projectUrl, setProjectUrl] = useState('');
  const [estimateField, setEstimateField] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onSubmit(projectUrl, estimateField);
  };

  return (
    <div className="github-form" onClick={e => e.stopPropagation()}>
      <form onSubmit={handleSubmit}>
        <label className="github-form__label">
          Project URL
          <input
            type="url"
            value={projectUrl}
            onChange={e => setProjectUrl(e.target.value)}
            placeholder="https://github.com/users/takegg0311/projects/3"
            disabled={loading}
            required
          />
        </label>
        <label className="github-form__label">
          Estimate フィールド名
          <input
            type="text"
            value={estimateField}
            onChange={e => setEstimateField(e.target.value)}
            placeholder="Estimate"
            disabled={loading}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? '取得中...' : '取得'}
        </button>
      </form>
      {error && <pre className="error">{error}</pre>}
    </div>
  );
}

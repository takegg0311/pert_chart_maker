import type { CPMResult } from '../types';
import './CPMPanel.css';

interface Props {
  cpm: CPMResult;
}

export function CPMPanel({ cpm }: Props) {
  return (
    <div className="cpm-panel">
      <div className="cpm-panel__header">
        <h3>CPM 詳細</h3>
        <span>プロジェクト全体: {cpm.projectDuration}日</span>
      </div>
      <table className="cpm-panel__table">
        <thead>
          <tr>
            <th>タスク</th>
            <th>工数</th>
            <th>ES</th>
            <th>EF</th>
            <th>LS</th>
            <th>LF</th>
            <th>TF</th>
          </tr>
        </thead>
        <tbody>
          {cpm.nodes.map(n => (
            <tr key={n.id} className={n.isCritical ? 'cpm-panel__row--critical' : ''}>
              <td>{n.name}</td>
              <td>{n.duration}</td>
              <td>{n.es}</td>
              <td>{n.ef}</td>
              <td>{n.ls}</td>
              <td>{n.lf}</td>
              <td>{n.tf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

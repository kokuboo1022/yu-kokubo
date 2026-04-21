import { useState } from 'react';

function parseDuration(str) {
  if (!str) return 0;
  const parts = str.split(':');
  if (parts.length === 2) {
    return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
  }
  return parseInt(str) || 0;
}

function formatDuration(sec) {
  if (!sec) return '';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function SongFormModal({ initial = {}, onSave, onClose }) {
  const [title, setTitle] = useState(initial.title || '');
  const [artist, setArtist] = useState(initial.artist || '');
  const [duration, setDuration] = useState(formatDuration(initial.durationSec));
  const [tempo, setTempo] = useState(initial.tempo || '');
  const [notes, setNotes] = useState(initial.notes || '');
  const [tags, setTags] = useState(initial.tags || []);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = tag => setTags(tags.filter(t => t !== tag));

  const handleTagKeyDown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      artist: artist.trim(),
      durationSec: parseDuration(duration),
      tempo: tempo || '',
      notes: notes.trim(),
      tags,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{initial.title ? '曲を編集' : '曲を追加'}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field">
            <span className="field-label">曲名 *</span>
            <input
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例: The Bucks of Oranmore"
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span className="field-label">アーティスト / トラッド</span>
            <input
              className="input"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="例: Traditional"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span className="field-label">演奏時間（M:SS）</span>
              <input
                className="input"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="3:30"
              />
            </label>
            <label className="field">
              <span className="field-label">テンポ</span>
              <select className="input select" value={tempo} onChange={e => setTempo(e.target.value)}>
                <option value="">未設定</option>
                <option value="high">速い (High)</option>
                <option value="middle">中 (Middle)</option>
                <option value="low">遅い (Low)</option>
              </select>
            </label>
          </div>
          <div className="field">
            <span className="field-label">タグ</span>
            <div className="tag-input-wrap">
              {tags.map(t => (
                <span key={t} className="tag tag--removable">
                  {t}
                  <button type="button" className="tag-remove" onClick={() => removeTag(t)}>×</button>
                </span>
              ))}
              <input
                className="tag-input"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder="タグ入力 → Enter"
              />
            </div>
            <p className="field-hint">Enter またはカンマで追加、複数可</p>
          </div>
          <label className="field">
            <span className="field-label">メモ・注意事項</span>
            <textarea
              className="input textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例: イントロは D→G→A、2番からハーモニーあり"
              rows={3}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn btn--primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}

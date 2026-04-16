import { useState } from 'react';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function EditModal({ task, categories, onSave, onDelete, onClose, onAddCategory, onDeleteCategory, onUpdateCategory, onMoveCategory }) {
  const [text, setText] = useState(task?.text ?? '');
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? (categories[0]?.id ?? ''));
  const [daysType, setDaysType] = useState(
    !task || task.days === 'all' ? 'all' : 'select'
  );
  const [selectedDays, setSelectedDays] = useState(
    Array.isArray(task?.days) ? task.days : []
  );
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📌');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatEmoji, setEditingCatEmoji] = useState('');

  function toggleDay(d) {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );
  }

  function handleSave() {
    if (!text.trim()) return;
    const days = daysType === 'all' ? 'all' : selectedDays;
    if (daysType === 'select' && selectedDays.length === 0) return;
    onSave({ text: text.trim(), categoryId, days });
  }

  function handleAddCategory() {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), newCatEmoji);
    setNewCatName('');
    setNewCatEmoji('📌');
  }

  function startEditCat(c) {
    setEditingCatId(c.id);
    setEditingCatName(c.name);
    setEditingCatEmoji(c.emoji);
  }

  function handleSaveCat(id) {
    if (!editingCatName.trim()) return;
    onUpdateCategory(id, { name: editingCatName.trim(), emoji: editingCatEmoji });
    setEditingCatId(null);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{task ? 'タスクを編集' : 'タスクを追加'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label className="form-label">タスク名</label>
          <input
            className="form-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="例: ご飯の用意"
            autoFocus
          />

          <label className="form-label">カテゴリ</label>
          <div className="category-row">
            <select
              className="form-select"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
            <button
              className="btn-secondary small"
              onClick={() => setShowCatManager(v => !v)}
            >
              ⚙
            </button>
          </div>

          {showCatManager && (
            <div className="cat-manager">
              <p className="cat-manager-title">カテゴリを管理</p>
              {categories.map(c => (
                <div key={c.id} className="cat-manager-row">
                  {editingCatId === c.id ? (
                    <>
                      <input
                        className="form-input small"
                        value={editingCatEmoji}
                        onChange={e => setEditingCatEmoji(e.target.value)}
                        style={{ width: '3rem' }}
                        maxLength={2}
                      />
                      <input
                        className="form-input small"
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                      />
                      <button className="btn-primary small" onClick={() => handleSaveCat(c.id)}>保存</button>
                      <button className="btn-secondary small" onClick={() => setEditingCatId(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <span>{c.emoji} {c.name}</span>
                      <button className="btn-secondary small" onClick={() => onMoveCategory(c.id, -1)} disabled={categories.indexOf(c) === 0}>↑</button>
                      <button className="btn-secondary small" onClick={() => onMoveCategory(c.id, 1)} disabled={categories.indexOf(c) === categories.length - 1}>↓</button>
                      <button className="btn-secondary small" onClick={() => startEditCat(c)}>編集</button>
                      <button className="btn-danger small" onClick={() => onDeleteCategory(c.id)}>削除</button>
                    </>
                  )}
                </div>
              ))}
              <div className="cat-add-row">
                <input
                  className="form-input small"
                  value={newCatEmoji}
                  onChange={e => setNewCatEmoji(e.target.value)}
                  style={{ width: '3rem' }}
                  maxLength={2}
                />
                <input
                  className="form-input small"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="新しいカテゴリ名"
                />
                <button className="btn-primary small" onClick={handleAddCategory}>追加</button>
              </div>
            </div>
          )}

          <label className="form-label">表示する曜日</label>
          <div className="days-type-row">
            <button
              className={`days-type-btn ${daysType === 'all' ? 'active' : ''}`}
              onClick={() => setDaysType('all')}
            >毎日</button>
            <button
              className={`days-type-btn ${daysType === 'select' ? 'active' : ''}`}
              onClick={() => setDaysType('select')}
            >曜日を選ぶ</button>
          </div>

          {daysType === 'select' && (
            <div className="days-grid">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  className={`day-btn ${selectedDays.includes(i) ? 'active' : ''}`}
                  onClick={() => toggleDay(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {onDelete && (
            <button className="btn-danger" onClick={onDelete}>削除</button>
          )}
          <div className="modal-footer-right">
            <button className="btn-secondary" onClick={onClose}>キャンセル</button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!text.trim() || (daysType === 'select' && selectedDays.length === 0)}
            >
              {task ? '保存' : '追加'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

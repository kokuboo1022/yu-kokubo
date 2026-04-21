import { useState, useMemo } from 'react';
import { useSongs } from '../hooks/useSongs';
import SongFormModal from '../components/SongFormModal';
import ConfirmModal from '../components/ConfirmModal';

function formatDuration(sec) {
  if (!sec) return '--:--';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function SongsPage() {
  const { songs, loading, addSong, updateSong, deleteSong } = useSongs();
  const [formTarget, setFormTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('title');
  const [search, setSearch] = useState('');

  const allTags = useMemo(() => {
    const set = new Set();
    songs.forEach(s => s.tags?.forEach(t => set.add(t)));
    return [...set].sort();
  }, [songs]);

  const toggleTag = tag =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );

  const filtered = useMemo(() => {
    let list = songs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        s => s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)
      );
    }
    if (selectedTags.length > 0) {
      list = list.filter(s => selectedTags.every(t => s.tags?.includes(t)));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ja');
      if (sortBy === 'artist') return (a.artist || '').localeCompare(b.artist || '', 'ja');
      if (sortBy === 'duration') return (b.durationSec || 0) - (a.durationSec || 0);
      if (sortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
      return 0;
    });
  }, [songs, search, selectedTags, sortBy]);

  const handleSave = async data => {
    if (formTarget === 'new') {
      await addSong(data);
    } else {
      await updateSong(formTarget.id, data);
    }
    setFormTarget(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">曲ライブラリ</h1>
        <button className="btn btn--primary" onClick={() => setFormTarget('new')}>
          + 曲を追加
        </button>
      </div>

      <div className="toolbar">
        <input
          className="input search-input"
          placeholder="曲名・アーティストで検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="title">曲名順</option>
          <option value="artist">アーティスト順</option>
          <option value="duration">演奏時間順</option>
          <option value="usage">採用回数順</option>
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter">
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag ${selectedTags.includes(tag) ? 'tag--active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button className="tag tag--clear" onClick={() => setSelectedTags([])}>
              × クリア
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {songs.length === 0 ? (
            <>
              <p>曲がまだありません</p>
              <button className="btn btn--primary" onClick={() => setFormTarget('new')}>
                最初の曲を追加
              </button>
            </>
          ) : (
            <p>条件に一致する曲が見つかりません</p>
          )}
        </div>
      ) : (
        <div className="song-list">
          {filtered.map(song => (
            <div key={song.id} className="song-item">
              <div className="song-item-main">
                <div className="song-item-title">{song.title}</div>
                {song.artist && <div className="song-item-artist">{song.artist}</div>}
                <div className="song-item-meta">
                  <span>{formatDuration(song.durationSec)}</span>
                  {song.tempo && <span>{{ high: '速い', middle: '中', low: '遅い' }[song.tempo]}</span>}
                  {(song.usageCount || 0) > 0 && (
                    <span className="song-meta-usage">{song.usageCount}回採用</span>
                  )}
                </div>
                {song.tags?.length > 0 && (
                  <div className="song-item-tags">
                    {song.tags.map(t => <span key={t} className="tag tag--sm">{t}</span>)}
                  </div>
                )}
                {song.notes && <div className="song-item-notes">{song.notes}</div>}
              </div>
              <div className="song-item-actions">
                <button className="btn btn--ghost btn--sm" onClick={() => setFormTarget(song)}>
                  編集
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => setDeleteTarget(song)}>
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formTarget && (
        <SongFormModal
          initial={formTarget === 'new' ? {} : formTarget}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`「${deleteTarget.title}」を削除しますか？`}
          onConfirm={() => {
            deleteSong(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

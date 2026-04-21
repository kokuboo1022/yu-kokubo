import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateDoc, doc, serverTimestamp, increment as firestoreIncrement } from 'firebase/firestore';
import { db } from '../firebase';
import { useSetlist } from '../hooks/useSetlist';
import { useSongs } from '../hooks/useSongs';
import SetlistFormModal from '../components/SetlistFormModal';

function formatDuration(sec) {
  if (!sec) return '--:--';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function formatTotal(sec) {
  if (!sec) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function SortableSongRow({ id, index, song, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 0,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className={`setlist-row ${isDragging ? 'setlist-row--dragging' : ''}`}>
      <span className="drag-handle" {...attributes} {...listeners} title="ドラッグして並び替え">⠿</span>
      <span className="row-number">{index + 1}</span>
      <div className="row-info">
        <span className="row-title">{song?.title || '(曲が削除されました)'}</span>
        {song?.artist && <span className="row-artist">{song.artist}</span>}
      </div>
      <div className="row-meta">
        {song?.tempo && <span className="row-key">{{ high: '速い', middle: '中', low: '遅い' }[song.tempo]}</span>}
        <span className="row-duration">{formatDuration(song?.durationSec)}</span>
      </div>
      <button className="btn-remove" onClick={() => onRemove(id)} aria-label="セットリストから削除">
        ×
      </button>
    </div>
  );
}

export default function SetlistPage() {
  const { id } = useParams();
  const { setlist, loading } = useSetlist(id);
  const { songs } = useSongs();

  const [localSongIds, setLocalSongIds] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [libSearch, setLibSearch] = useState('');
  const [libSortBy, setLibSortBy] = useState('title');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (setlist?.songIds) setLocalSongIds(setlist.songIds);
  }, [setlist?.songIds]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const saveIds = newIds =>
    updateDoc(doc(db, 'setlists', id), { songIds: newIds, updatedAt: serverTimestamp() });

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = localSongIds.indexOf(active.id);
    const newIdx = localSongIds.indexOf(over.id);
    const newIds = arrayMove(localSongIds, oldIdx, newIdx);
    setLocalSongIds(newIds);
    saveIds(newIds);
  };

  const addSong = async songId => {
    if (localSongIds.includes(songId)) return;
    const newIds = [...localSongIds, songId];
    setLocalSongIds(newIds);
    await saveIds(newIds);
    await updateDoc(doc(db, 'songs', songId), { usageCount: firestoreIncrement(1) });
  };

  const removeSong = songId => {
    const newIds = localSongIds.filter(s => s !== songId);
    setLocalSongIds(newIds);
    saveIds(newIds);
  };

  const saveSetlistInfo = data =>
    updateDoc(doc(db, 'setlists', id), { ...data, updatedAt: serverTimestamp() });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setlistSongs = useMemo(
    () => localSongIds.map(sid => songs.find(s => s.id === sid)),
    [localSongIds, songs]
  );

  const totalSec = useMemo(
    () => setlistSongs.reduce((sum, s) => sum + (s?.durationSec || 0), 0),
    [setlistSongs]
  );

  const allTags = useMemo(() => {
    const set = new Set();
    songs.forEach(s => s.tags?.forEach(t => set.add(t)));
    return [...set].sort();
  }, [songs]);

  const toggleTag = tag =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );

  const librarySongs = useMemo(() => {
    let list = songs;
    if (libSearch.trim()) {
      const q = libSearch.toLowerCase();
      list = list.filter(
        s => s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)
      );
    }
    if (selectedTags.length > 0) {
      list = list.filter(s => selectedTags.every(t => s.tags?.includes(t)));
    }
    return [...list].sort((a, b) => {
      if (libSortBy === 'title') return a.title.localeCompare(b.title, 'ja');
      if (libSortBy === 'artist') return (a.artist || '').localeCompare(b.artist || '', 'ja');
      if (libSortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
      return 0;
    });
  }, [songs, libSearch, selectedTags, libSortBy]);

  const displayDate = setlist?.date
    ? new Date(setlist.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  if (loading) return <div className="loading">読み込み中...</div>;
  if (!setlist) {
    return (
      <div className="page">
        <p>セットリストが見つかりません</p>
        <Link to="/" className="btn btn--ghost" style={{ marginTop: '1rem' }}>← 一覧へ</Link>
      </div>
    );
  }

  return (
    <div className="page page--setlist">
      <div className="setlist-header">
        <div className="setlist-header-top">
          <Link to="/" className="back-link">← 一覧へ</Link>
          <div className="setlist-header-actions">
            <button className="btn btn--ghost btn--sm" onClick={() => setShowEditForm(true)}>
              ✏️ 編集
            </button>
            <button className="btn btn--ghost btn--sm" onClick={copyLink}>
              {copied ? '✓ コピー済み' : '🔗 URLをコピー'}
            </button>
          </div>
        </div>
        <h1 className="setlist-title">{setlist.name || '無題のセットリスト'}</h1>
        {(displayDate || setlist.venue) && (
          <div className="setlist-info">
            {displayDate && <span>{displayDate}</span>}
            {setlist.venue && <span>📍 {setlist.venue}</span>}
          </div>
        )}
        <div className="setlist-summary">
          <span className="summary-count">{localSongIds.length}曲</span>
          <span className="summary-sep">•</span>
          <span className="summary-total">合計 {formatTotal(totalSec)}</span>
        </div>
      </div>

      <div className="setlist-builder">
        <section className="builder-setlist">
          <h2 className="section-title">セットリスト</h2>
          {localSongIds.length === 0 ? (
            <div className="empty-state empty-state--sm">
              <p>右の曲ライブラリから曲を追加してください</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localSongIds} strategy={verticalListSortingStrategy}>
                {localSongIds.map((songId, idx) => (
                  <SortableSongRow
                    key={songId}
                    id={songId}
                    index={idx}
                    song={songs.find(s => s.id === songId)}
                    onRemove={removeSong}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </section>

        <section className="builder-library">
          <h2 className="section-title">曲ライブラリから追加</h2>
          <div className="library-toolbar">
            <input
              className="input search-input"
              placeholder="検索..."
              value={libSearch}
              onChange={e => setLibSearch(e.target.value)}
            />
            <select
              className="input select"
              value={libSortBy}
              onChange={e => setLibSortBy(e.target.value)}
            >
              <option value="title">曲名順</option>
              <option value="artist">アーティスト順</option>
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

          <div className="library-list">
            {librarySongs.length === 0 ? (
              <p className="text-muted">条件に一致する曲がありません</p>
            ) : (
              librarySongs.map(song => {
                const added = localSongIds.includes(song.id);
                return (
                  <div key={song.id} className={`library-row ${added ? 'library-row--added' : ''}`}>
                    <div className="library-row-info">
                      <span className="library-row-title">{song.title}</span>
                      {song.artist && <span className="library-row-artist">{song.artist}</span>}
                      <div className="library-row-meta">
                        <span>{formatDuration(song.durationSec)}</span>
                        {song.tempo && <span>{{ high: '速い', middle: '中', low: '遅い' }[song.tempo]}</span>}
                        {song.tags?.map(t => (
                          <span key={t} className="tag tag--sm">{t}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      className={`btn ${added ? 'btn--ghost' : 'btn--primary'} btn--sm`}
                      onClick={() => addSong(song.id)}
                      disabled={added}
                    >
                      {added ? '追加済' : '+ 追加'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {showEditForm && (
        <SetlistFormModal
          initial={setlist}
          onSave={data => {
            saveSetlistInfo(data);
            setShowEditForm(false);
          }}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}

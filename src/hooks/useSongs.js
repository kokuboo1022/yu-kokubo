import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, increment as firestoreIncrement,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('title'));
    return onSnapshot(q, snap => {
      setSongs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const addSong = data =>
    addDoc(collection(db, 'songs'), {
      title: data.title,
      artist: data.artist || '',
      durationSec: data.durationSec || 0,
      tempo: data.tempo || '',
      tags: data.tags || [],
      notes: data.notes || '',
      usageCount: 0,
      createdAt: serverTimestamp(),
    });

  const updateSong = (id, data) => updateDoc(doc(db, 'songs', id), data);
  const deleteSong = id => deleteDoc(doc(db, 'songs', id));
  const incrementUsage = id =>
    updateDoc(doc(db, 'songs', id), { usageCount: firestoreIncrement(1) });

  return { songs, loading, addSong, updateSong, deleteSong, incrementUsage };
}

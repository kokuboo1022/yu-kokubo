import { useState, useEffect } from 'react';
import { DEFAULT_TASKS, DEFAULT_CATEGORIES } from '../data/defaultTasks';

const STORAGE_KEY = 'morning-todo';

function getTodayString() {
  return new Date().toLocaleDateString('ja-JP');
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useTaskStore() {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [lastDate, setLastDate] = useState('');

  useEffect(() => {
    const stored = loadState();
    const today = getTodayString();

    if (!stored) {
      // 初回起動
      setCategories(DEFAULT_CATEGORIES);
      setTasks(DEFAULT_TASKS);
      setLastDate(today);
      saveState({ categories: DEFAULT_CATEGORIES, tasks: DEFAULT_TASKS, lastDate: today });
    } else {
      let { categories: cats, tasks: ts, lastDate: ld } = stored;

      if (ld !== today) {
        // 日付が変わったらチェックをリセット
        ts = ts.map(t => ({ ...t, checked: false }));
        ld = today;
      }

      setCategories(cats);
      setTasks(ts);
      setLastDate(ld);
      saveState({ categories: cats, tasks: ts, lastDate: ld });
    }
  }, []);

  function persist(newCats, newTasks) {
    setCategories(newCats);
    setTasks(newTasks);
    saveState({ categories: newCats, tasks: newTasks, lastDate: lastDate || getTodayString() });
  }

  function toggleTask(id) {
    const updated = tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t);
    persist(categories, updated);
  }

  function addTask(categoryId, text, days) {
    const newTask = {
      id: `task-${Date.now()}`,
      categoryId,
      text,
      days,
      checked: false,
    };
    persist(categories, [...tasks, newTask]);
  }

  function deleteTask(id) {
    persist(categories, tasks.filter(t => t.id !== id));
  }

  function updateTask(id, updates) {
    persist(categories, tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  function addCategory(name, emoji) {
    const newCat = { id: `cat-${Date.now()}`, name, emoji };
    persist([...categories, newCat], tasks);
  }

  function updateCategory(catId, updates) {
    persist(categories.map(c => c.id === catId ? { ...c, ...updates } : c), tasks);
  }

  function deleteCategory(catId) {
    persist(
      categories.filter(c => c.id !== catId),
      tasks.filter(t => t.categoryId !== catId)
    );
  }

  return {
    categories,
    tasks,
    toggleTask,
    addTask,
    deleteTask,
    updateTask,
    updateCategory,
    addCategory,
    deleteCategory,
  };
}

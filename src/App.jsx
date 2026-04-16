import { useState } from 'react';
import { useTaskStore } from './hooks/useTaskStore';
import TaskList from './components/TaskList';
import EditModal from './components/EditModal';
import './App.css';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function getTodayInfo() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=日, 1=月, ...
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayName = DAY_NAMES[dayOfWeek];
  return { dayOfWeek, label: `${month}月${date}日（${dayName}）`, dayName };
}

function isActiveToday(task, dayOfWeek) {
  if (task.days === 'all') return true;
  return Array.isArray(task.days) && task.days.includes(dayOfWeek);
}

export default function App() {
  const store = useTaskStore();
  const [editMode, setEditMode] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState(null);

  const today = getTodayInfo();

  const activeTasks = store.tasks.filter(t => isActiveToday(t, today.dayOfWeek));
  const totalCount = activeTasks.length;
  const checkedCount = activeTasks.filter(t => t.checked).length;
  const allDone = totalCount > 0 && checkedCount === totalCount;

  function handleEditTask(task) {
    setEditTarget(task);
    setEditMode(true);
  }

  function handleAddTask(categoryId = null) {
    setEditTarget(null);
    setDefaultCategoryId(categoryId);
    setEditMode(true);
  }

  function handleSaveTask(data) {
    if (editTarget) {
      store.updateTask(editTarget.id, data);
    } else {
      store.addTask(data.categoryId, data.text, data.days);
    }
    setEditMode(false);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-title">
          <span className="header-emoji">{allDone ? '🎉' : '☀️'}</span>
          <h1>朝のタスク</h1>
        </div>
        <div className="header-date">{today.label}</div>
        <div className="header-progress">
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
          <span className="progress-text">{checkedCount} / {totalCount}</span>
        </div>
        {allDone && <div className="all-done-msg">今日もお疲れさまです！</div>}
      </header>

      <main className="main">
        {store.categories.map(cat => {
          const catTasks = store.tasks
            .filter(t => t.categoryId === cat.id)
            .map(t => ({ ...t, inactive: !isActiveToday(t, today.dayOfWeek) }));
          return (
            <TaskList
              key={cat.id}
              category={cat}
              tasks={catTasks}
              onToggle={store.toggleTask}
              onEdit={handleEditTask}
              onDeleteTask={store.deleteTask}
              onReorder={store.reorderTasks}
              onAddToCategory={handleAddTask}
            />
          );
        })}
      </main>

      <button className="fab" onClick={handleAddTask} aria-label="タスクを追加">
        ＋
      </button>

      {editMode && (
        <EditModal
          task={editTarget}
          defaultCategoryId={defaultCategoryId}
          categories={store.categories}
          onSave={handleSaveTask}
          onDelete={editTarget ? () => { store.deleteTask(editTarget.id); setEditMode(false); } : null}
          onClose={() => setEditMode(false)}
          onAddCategory={store.addCategory}
          onUpdateCategory={store.updateCategory}
          onMoveCategory={store.moveCategory}
          onDeleteCategory={store.deleteCategory}
        />
      )}
    </div>
  );
}

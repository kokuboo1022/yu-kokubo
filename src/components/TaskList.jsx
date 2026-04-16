import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTaskItem({ task, onToggle, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 'auto',
  };

  return (
    <li ref={setNodeRef} style={style} className={`task-item ${task.checked ? 'checked' : ''}`}>
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <button
        className="task-check-btn"
        onClick={() => onToggle(task.id)}
        aria-label={task.checked ? 'チェックを外す' : 'チェックする'}
      >
        <span className="task-checkbox">{task.checked ? '✓' : ''}</span>
      </button>
      <span className="task-text" onClick={() => onToggle(task.id)}>
        {task.text}
        {Array.isArray(task.days) && (
          <span className="task-days-badge">
            {task.days.map(d => ['日', '月', '火', '水', '木', '金', '土'][d]).join('・')}
          </span>
        )}
      </span>
      <button className="task-edit-btn" onClick={() => onEdit(task)} aria-label="編集">⋯</button>
    </li>
  );
}

export default function TaskList({ category, tasks, onToggle, onEdit, onReorder, onAddToCategory }) {
  const doneCount = tasks.filter(t => t.checked).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  }

  return (
    <section className="task-section">
      <div className="section-header">
        <span className="section-emoji">{category.emoji}</span>
        <h2 className="section-title">{category.name}</h2>
        <span className="section-count">{doneCount}/{tasks.length}</span>
        <button className="section-add-btn" onClick={() => onAddToCategory(category.id)} aria-label="タスクを追加">＋</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="task-list">
            {tasks.map(task => (
              <SortableTaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

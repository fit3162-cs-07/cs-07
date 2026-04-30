import { useState, useEffect, useCallback } from 'react';
import * as api from './api';

// ─── Toast ───────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return <div className="toast">{message}</div>;
}

// ─── Login Page ──────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (user: api.User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const fillDemo = (type: 'admin' | 'member1' | 'member2') => {
    if (type === 'admin') {
      setEmail('admin@monash.edu');
      setPassword('admin123');
    } else if (type === 'member1') {
      setEmail('member1@monash.edu');
      setPassword('member123');
    } else {
      setEmail('member2@monash.edu');
      setPassword('member123');
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await api.login(email, password);
      api.setToken(token);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      onLogin(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setError('Google sign-in is not implemented in this project yet.');
  };

  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="topbar-left">
          <button type="button" className="icon-button" aria-label="Menu">
            ☰
          </button>

          <div className="brand">
            <span className="brand-mark">✳</span>
            <span className="brand-text">MonashClub</span>
          </div>
        </div>

        <div className="topbar-right">
          <span className="topbar-icon">⌕</span>
          <span className="topbar-icon">⊞</span>
          <span className="profile-avatar" />
        </div>
      </header>

      <main className="login-content">
        <form className="login-panel" onSubmit={handleSubmit}>
          <h2>Log In</h2>
          <p>Use your Monash Email to sign in</p>

          <input
            className="login-input"
            type="email"
            placeholder="Enter your Monash Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            className="login-input"
            type="password"
            placeholder="Enter your Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login with Monash Email'}
          </button>

          {error && <div className="login-error">{error}</div>}

          <div className="login-divider">
            <span>or continue with</span>
          </div>

          <button
            type="button"
            className="google-login-btn"
            onClick={handleGoogleClick}
          >
            <span className="google-mark">G</span>
            <span>Google</span>
          </button>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <div className="demo-box">
            <div className="demo-box-title">Demo Accounts</div>
            <div className="demo-actions">
              <button type="button" onClick={() => fillDemo('admin')}>
                Admin
              </button>
              <button type="button" onClick={() => fillDemo('member1')}>
                Member 1
              </button>
              <button type="button" onClick={() => fillDemo('member2')}>
                Member 2
              </button>
            </div>
            <div className="demo-text">
              admin@monash.edu / admin123 <br />
              member1@monash.edu / member123 <br />
              member2@monash.edu / member123
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

// ─── Task Card ───────────────────────────────────────────
function TaskCard({ task, onClick }: { task: api.Task; onClick: () => void }) {
  const priorityClass = `badge badge-${task.priority.toLowerCase()}`;
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;

  return (
    <div className="task-card" onClick={onClick}>
      <div className="task-card-title">{task.title}</div>
      {task.description && <div className="task-card-desc">{task.description}</div>}
      <div className="task-card-meta">
        <span className={priorityClass}>{task.priority}</span>
        {task.assigneeId && <span className="badge badge-assignee">Assigned</span>}
        {due && <span className="badge badge-due">Due {due}</span>}
      </div>
    </div>
  );
}

// ─── Create / Edit Modal ─────────────────────────────────
function TaskModal({
  task,
  isAdmin,
  onClose,
  onSaved,
  onDeleted,
  toast,
}: {
  task: api.Task | null;
  isAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  toast: (msg: string) => void;
}) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<api.Task['priority']>(
    task?.priority || 'MEDIUM'
  );
  const [status, setStatus] = useState<api.Task['status']>(
    task?.status || 'TODO'
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEdit && task) {
        if (task.status !== status) {
          await api.changeStatus(task.id, status);
        }
        await api.updateTask(task.id, {
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
        toast('Task updated');
      } else {
        await api.createTask({
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
        toast('Task created');
      }
      onSaved();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await api.deleteTask(task.id);
      toast('Task deleted');
      onDeleted();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{isEdit ? 'Edit Task' : 'New Task'}</h3>
        <div className="field">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
        </div>
        <div className="field">
          <label>Priority</label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as api.Task['priority'])}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div className="field">
          <label>Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        {isEdit && (
          <div className="field">
            <label>Status</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map(s => (
                <button key={s} className={`btn-status ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="modal-actions">
          {isEdit && isAdmin && <button className="btn-delete" onClick={handleDelete}>Delete</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Board ───────────────────────────────────────────────
function Board({ user, onLogout }: { user: api.User; onLogout: () => void }) {
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; task?: api.Task } | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const isAdmin = user.role === 'ADMIN';

  const loadTasks = useCallback(async () => {
    try {
      const filters: Record<string, string> = {};
      if (filterPriority) filters.priority = filterPriority;
      const data = await api.getTasks(filters);
      setTasks(data);
    } catch {
      setToastMsg('Failed to load tasks');
    }
  }, [filterPriority]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const toast = (msg: string) => setToastMsg(msg);

  const cols: { key: api.Task['status']; label: string; className: string }[] = [
    { key: 'TODO', label: 'To Do', className: 'col-todo' },
    { key: 'IN_PROGRESS', label: 'In Progress', className: 'col-inprogress' },
    { key: 'DONE', label: 'Done', className: 'col-done' },
  ];

  return (
    <>
      <nav className="navbar">
        <h1>Monash Club Task Manager</h1>
        <div className="navbar-right">
          <span>{user.name} ({user.role})</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div className="board-container">
        <div className="board-header">
          <h2>Task Board</h2>
          {isAdmin && <button className="btn-create" onClick={() => setModal({ mode: 'create' })}>+ New Task</button>}
        </div>

        <div className="filters">
          <label>Priority:</label>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="kanban">
          {cols.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className={`kanban-col ${col.className}`}>
                <div className="kanban-col-header">
                  {col.label}
                  <span className="count">{colTasks.length}</span>
                </div>
                {colTasks.map(t => (
                  <TaskCard key={t.id} task={t} onClick={() => setModal({ mode: 'edit', task: t })} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <TaskModal
          task={modal.task || null}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            void loadTasks();
          }}
          onDeleted={() => {
            setModal(null);
            void loadTasks();
          }}
          toast={toast}
        />
      )}

      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg('')} />}
    </>
  );
}

// ─── App Root ────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<api.User | null>(null);

  const handleLogout = () => {
    api.setToken('');
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={setUser} />;
  return <Board user={user} onLogout={handleLogout} />;
}

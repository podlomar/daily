import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, UnauthorizedError } from '../../api';
import type { Todo } from '../../types';
import { Layout } from '../../components/Layout/Layout';
import styles from './TodosPage.module.css';

export const TodosPage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getTodos()
      .then((res) => setTodos(res.result))
      .catch((err) => {
        if (err instanceof UnauthorizedError) navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setAdding(true);
    try {
      const res = await api.createTodo({ text: text.trim() });
      setTodos((prev) => [res.result, ...prev]);
      setText('');
      inputRef.current?.focus();
    } catch (err) {
      if (err instanceof UnauthorizedError) navigate('/login');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      await api.updateTodo(todo.id, { done: !todo.done });
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t))
      );
    } catch (err) {
      if (err instanceof UnauthorizedError) navigate('/login');
    }
  };

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="new todo…"
          autoFocus
        />
        <button
          className={styles.addBtn}
          type="submit"
          disabled={!text.trim() || adding}
        >
          add
        </button>
      </form>

      {todos.length === 0 && (
        <div className={styles.empty}>no todos yet</div>
      )}

      {pending.length > 0 && (
        <ul className={styles.list}>
          {pending.map((todo) => (
            <li key={todo.id} className={styles.item}>
              <button
                className={`${styles.check} ${styles.checkPending}`}
                onClick={() => handleToggle(todo)}
                aria-label="Mark as done"
              >
                ○
              </button>
              <span className={styles.text}>{todo.text}</span>
              <span className={styles.date}>{todo.createdAt}</span>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          {pending.length > 0 && <div className={styles.divider} />}
          <ul className={styles.list}>
            {done.map((todo) => (
              <li key={todo.id} className={`${styles.item} ${styles.itemDone}`}>
                <button
                  className={`${styles.check} ${styles.checkDone}`}
                  onClick={() => handleToggle(todo)}
                  aria-label="Mark as pending"
                >
                  ●
                </button>
                <span className={`${styles.text} ${styles.textDone}`}>{todo.text}</span>
                <span className={styles.date}>{todo.createdAt}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Layout>
  );
};

import * as SQLite from 'expo-sqlite';

export type Task = { id: number; title: string; completed: number | null };

async function openDatabase() {
  const db = await SQLite.openDatabaseAsync('tasks.db');
  try {
    await db.execAsync(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0
    )`);
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

let connection: Promise<SQLite.SQLiteDatabase> | undefined;

export function initDatabase() {
  return connection ??= openDatabase().catch(error => {
    connection = undefined;
    throw error;
  });
}

export async function getTasks() {
  const db = await initDatabase();
  return db.getAllAsync<Task>('SELECT id, title, completed FROM tasks ORDER BY id DESC');
}

export async function insertTask(title: string) {
  const db = await initDatabase();
  await db.runAsync('INSERT INTO tasks (title, completed) VALUES (?, 0)', title);
}

export async function deleteTask(id: number) {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
}

export async function toggleComplete(id: number, value: boolean) {
  const db = await initDatabase();
  await db.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', Number(value), id);
}

import sqlite3 from 'sqlite3'
import { Database } from 'sqlite3'

const db: Database = new sqlite3.Database('./data.db')

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS publications (
      token_id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS chapters (
      token_id INTEGER NOT NULL,
      chapter_id INTEGER NOT NULL,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (token_id, chapter_id),
      FOREIGN KEY (token_id) REFERENCES publications(token_id)
    )
  `)
})

export default db

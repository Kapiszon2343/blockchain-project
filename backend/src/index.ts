import express, { Request, Response } from 'express'
import cors from 'cors'
import db from './db'
import stringSimilarity from 'string-similarity'

const app = express()
app.use(cors())
app.use(express.json())

interface PublishRequest {
  tokenId: number
  title: string
  authorPublicKey: string
}

app.post('/publish', (req: Request, res: Response) => {
  const { tokenId, title } = req.body as PublishRequest
  console.log("Adding to db: ", req.body);
  db.run(
    'INSERT INTO publications (token_id, title) VALUES (?, ?)',
    [tokenId, title],
    function (err: Error | null) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json({ success: true, id: this.lastID })
    }
  )
})

app.post('/update', (req: Request, res: Response) => {
  const { tokenId, chapterId, content } = req.body

  db.run(
    'INSERT INTO chapters (token_id, chapter_id, content) VALUES (?, ?, ?)',
    [tokenId, chapterId, content],
    function (err: Error | null) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json({ success: true, id: this.lastID })
    }
  )
})

app.post('/check_plagiarism', (req: Request, res: Response) => {
  const inputText: string = req.body.text

  if (!inputText || typeof inputText !== 'string') {
    res.status(400).json({ error: "Missing or invalid 'text' in request body" })
    return
  }

  const query = `
    SELECT chapters.token_id, chapters.chapter_id, chapters.content, publications.title
    FROM chapters
    JOIN publications ON chapters.token_id = publications.token_id
  `

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    const matches = rows
      .map((chapter: any) => {
        const similarity = stringSimilarity.compareTwoStrings(inputText, chapter.content)
        return {
          tokenId: chapter.token_id,
          title: chapter.title,
          chapterId: chapter.chapter_id,
          similarity: Math.round(similarity * 100),
        }
      })
      .filter((result) => result.similarity >= 70)
      .sort((a, b) => b.similarity - a.similarity)

    res.json({ matches })
  })
})

app.get('/publications', (req: Request, res: Response) => {
  db.all('SELECT * FROM publications', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

app.get('/chapters', (req: Request, res: Response) => {
  db.all('SELECT * FROM chapters', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

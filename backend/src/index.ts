import express, { Request, Response } from 'express'
import cors from 'cors'
import db from './db'

const app = express()
app.use(cors())
app.use(express.json())

interface PublishRequest {
  tokenId: number
  title: string
  publicKey: string
}

app.post('/publish', (req: Request, res: Response) => {
  const { tokenId, title, publicKey } = req.body as PublishRequest

  db.run(
    'INSERT INTO publications (token_id, title, public_key) VALUES (?, ?, ?)',
    [tokenId, title, publicKey],
    function (err: Error | null) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json({ success: true, id: this.lastID })
    }
  )
})

app.post('/publish', (req: Request, res: Response) => {
  const { tokenId, chapterId, content, signature } = req.body

  db.run(
    'INSERT INTO publications (token_id, title, public_key) VALUES (?, ?, ?)',
    [tokenId, chapterId, content, signature],
    function (err: Error | null) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json({ success: true, id: this.lastID })
    }
  )
})

app.get('/publications', (req: Request, res: Response) => {
  db.all('SELECT * FROM publications', [], (err, rows) => {
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

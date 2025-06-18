import request from 'supertest'
import db from '../src/db'

// Importuj app z osobnego pliku zamiast odpalać serwer w teście
import { app } from '../src/app'

describe('API tests', () => {
  beforeAll((done) => {
    // Ustawienia testowej bazy (np. in-memory SQLite)
    db.serialize(() => {
      db.run('DELETE FROM publications')
      db.run('DELETE FROM chapters')
      done()
    })
  })

  it('POST /publish should add a publication', async () => {
    const res = await request(app).post('/publish').send({
      tokenId: 123,
      title: 'Test publication',
      authorPublicKey: '0xabc'
    })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('success', true)
  })

  it('POST /update should add a chapter', async () => {
    const res = await request(app).post('/update').send({
      tokenId: 123,
      chapterId: 1,
      content: 'Test chapter content'
    })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('success', true)
  })

  it('POST /check_plagiarism should find similar content', async () => {
    const res = await request(app).post('/check_plagiarism').send({
      text: 'Test chapter content'
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.matches.length).toBeGreaterThan(0)
    expect(res.body.matches[0]).toHaveProperty('similarity')
  })

  it('POST /check_plagiarism should find no matches', async () => {
    const res = await request(app).post('/check_plagiarism').send({
      text: 'nothing'
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.matches.length).toBe(0)
  })
})

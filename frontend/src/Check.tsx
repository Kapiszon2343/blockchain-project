import { useState } from 'react'

export function Check() {
  const [step, setStep] = useState<number>(0)
  const [matches, setMatches] = useState<
    { tokenId: number; title: string; chapterId: number; similarity: number }[]
  >([])

  async function callCheck(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    const content = formData.get('content') as string 

    const payload = {
      text: content
    }

    try {
      const res = await fetch('http://localhost:3001/check_plagiarism', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      setStep(1)

      const data = await res.json()
      if (res.ok) {
        console.log("Submitted content to check")
        setMatches(data.matches)
        setStep(2)
      } else {
        console.error(data.error)
        setStep(3)
      }
    } catch (err) {
      console.error(err)
      setStep(3)
    }
  }

  return (
    <div>

      <form onSubmit={callCheck}>
        <button 
          type="submit"
        >
          Check for plagiarism
        </button>
        <br/>
        <textarea 
          name="content" 
          placeholder="content to check" 
          required 
          rows={10}
          className="textarea-large"
        />
        
      </form>
        
      {step == 1 && <div>Cheking for plagiarism</div>}
      {step === 2 && (
        <div>
          <h3>Similar Chapters Found:</h3>
          {matches.length === 0 ? (
            <div>No significant similarities found.</div>
          ) : (
            <ul>
              {matches.map((match, idx) => (
                <li key={idx}>
                  <strong>{match.title}</strong> — Chapter {match.chapterId} (Token ID: {match.tokenId})<br />
                  Similarity: {match.similarity}%
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {step === 3 && <div>An error occurred. Please try again later.</div>}
    </div>
  )
}
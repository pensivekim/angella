import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [photo, setPhoto] = useState<string | null>(null)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!photo) {
      setError('사진을 업로드해주세요.')
      return
    }
    if (!height || !weight) {
      setError('키와 몸무게를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo,
          height: Number(height),
          weight: Number(weight),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      }

      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setReport(null)
    setPhoto(null)
    setHeight('')
    setWeight('')
    setError(null)
  }

  if (report) {
    return (
      <div className="container">
        <div className="header">
          <h1>Angella</h1>
          <p className="subtitle">스타일 컨설팅 보고서</p>
        </div>

        <div className="report-card">
          <div className="report-content">
            {report.split('\n').map((line, index) => {
              if (line.startsWith('##')) {
                return <h2 key={index}>{line.replace(/^##\s*/, '')}</h2>
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <h3 key={index}>{line.replace(/\*\*/g, '')}</h3>
              }
              if (line.match(/^\d+\.\s*\*\*/)) {
                return (
                  <h3 key={index}>
                    {line.replace(/^\d+\.\s*\*\*/, '').replace(/\*\*.*$/, '')}
                  </h3>
                )
              }
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={index}>{line.replace(/^[-*]\s*/, '')}</li>
              }
              if (line.trim() === '') {
                return <br key={index} />
              }
              return <p key={index}>{line}</p>
            })}
          </div>
          <button onClick={handleReset} className="submit-btn">
            다시 분석하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Angella</h1>
        <p className="subtitle">당신만의 퍼스널 스타일리스트</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="photo-section">
          <div className="photo-upload" onClick={handlePhotoClick}>
            {photo ? (
              <img src={photo} alt="프로필 사진" className="photo-preview" />
            ) : (
              <div className="photo-placeholder">
                <span className="photo-icon">+</span>
                <span className="photo-text">사진 추가</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            hidden
          />
        </div>

        <div className="input-group">
          <label htmlFor="height">키 (cm)</label>
          <input
            type="number"
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="170"
            min="100"
            max="250"
          />
        </div>

        <div className="input-group">
          <label htmlFor="weight">몸무게 (kg)</label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="65"
            min="30"
            max="200"
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <span className="loading-text">
              <span className="spinner"></span>
              AI가 분석 중입니다...
            </span>
          ) : (
            '스타일 분석 시작하기'
          )}
        </button>
      </form>
    </div>
  )
}

export default App

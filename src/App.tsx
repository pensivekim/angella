import React, { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import './App.css'

// Polar Product ID
const POLAR_PRODUCT_ID = import.meta.env.VITE_POLAR_PRODUCT_ID || '878d0b34-e80b-4425-bed1-d927d53201ee'

const STYLE_OPTIONS = [
  { id: 'minimal', label: 'Minimal', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
  { id: 'streetwear', label: 'Streetwear', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400' },
  { id: 'casual', label: 'Casual', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400' },
  { id: 'formal', label: 'Formal', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400' },
]

const COLOR_OPTIONS = [
  { id: 'warm', label: 'Warm Tones', desc: '따뜻한 컬러' },
  { id: 'cool', label: 'Cool Tones', desc: '차가운 컬러' },
  { id: 'neutral', label: 'Neutral', desc: '뉴트럴 컬러' },
  { id: 'vibrant', label: 'Vibrant', desc: '비비드 컬러' },
]

const OCCASION_OPTIONS = [
  { id: 'daily', label: 'Daily', icon: 'wb_sunny' },
  { id: 'office', label: 'Office', icon: 'work' },
  { id: 'date', label: 'Date', icon: 'favorite' },
  { id: 'party', label: 'Party', icon: 'celebration' },
]

const WARDROBE_ITEMS = [
  { id: 1, category: 'Work', name: 'Classic Navy Suit', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', liked: true },
  { id: 2, category: 'Date', name: 'Midnight Silk', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400', liked: false },
  { id: 3, category: 'Weekend', name: 'Summer Wedding', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', liked: false },
  { id: 4, category: 'Weekend', name: 'Sunday Knitwear', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400', liked: true },
  { id: 5, category: 'Work', name: 'Office Layers', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400', liked: false },
  { id: 6, category: 'Date', name: 'Rooftop Glam', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400', liked: false },
]

function App() {
  const [photo, setPhoto] = useState<string | null>(null)
  const [height, setHeight] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('minimal')
  const [selectedColor, setSelectedColor] = useState<string>('neutral')
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(['daily'])
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0: home, 1: photo, 2: style preferences, 3: checkout
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('home') // home, wardrobe, metrics, profile
  const [wardrobeCategory, setWardrobeCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [isPaid, setIsPaid] = useState(() => {
    // Check for success parameter in URL
    const params = new URLSearchParams(window.location.search)
    return params.get('success') === 'true'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  const toggleOccasion = (id: string) => {
    setSelectedOccasions(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    )
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setError(null)

    try {
      // 결제 전에 사용자 입력 데이터 저장
      const userData = {
        photo,
        height,
        weight,
        selectedStyle,
        selectedColor,
        selectedOccasions,
      }
      localStorage.setItem('angella_user_data', JSON.stringify(userData))

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: POLAR_PRODUCT_ID,
          successUrl: `${window.location.origin}/?success=true`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '결제 세션 생성에 실패했습니다.')
      }

      // Redirect to Polar checkout
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.')
      setCheckoutLoading(false)
    }
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhoto(reader.result as string)
      setError(null)
      setIsAnalyzing(true)
      setTimeout(() => {
        setIsAnalyzing(false)
      }, 2000)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const runAnalysis = async () => {
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo,
          height,
          weight,
          style: selectedStyle,
          colorPreference: selectedColor,
          occasions: selectedOccasions,
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
      setIsPaid(false)
    }
  }

  const handleReset = () => {
    setReport(null)
    setPhoto(null)
    setHeight('')
    setWeight('')
    setSelectedStyle('minimal')
    setSelectedColor('neutral')
    setSelectedOccasions(['daily'])
    setError(null)
    setCurrentStep(0)
    setIsAnalyzing(false)
    setActiveTab('home')
    setIsPaid(false)
  }

  const handleNavClick = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'home') {
      setCurrentStep(0)
    }
  }

  // 리포트를 이미지로 캡처
  const captureReport = async (): Promise<Blob | null> => {
    if (!reportRef.current) return null

    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#120a12',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      })

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0)
      })
    } catch (err) {
      console.error('Failed to capture report:', err)
      return null
    }
  }

  // 이미지로 저장
  const handleSaveImage = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const blob = await captureReport()
      if (!blob) {
        throw new Error('이미지 생성에 실패했습니다.')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `angella-style-report-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 공유하기
  const handleShare = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const blob = await captureReport()
      if (!blob) {
        throw new Error('이미지 생성에 실패했습니다.')
      }

      const file = new File([blob], 'angella-style-report.png', { type: 'image/png' })

      // Web Share API 지원 확인
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'ANGELLA Style Report',
          text: 'AI가 분석한 나만의 스타일 리포트를 확인해보세요!',
          files: [file],
        })
      } else {
        // Web Share API 미지원 시 클립보드 복사 또는 다운로드로 대체
        const url = URL.createObjectURL(blob)

        // 공유 모달 표시 (간단한 fallback)
        const shareUrl = window.location.origin
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(`ANGELLA Style Report - AI가 분석한 나만의 스타일 리포트: ${shareUrl}`)
          alert('링크가 클립보드에 복사되었습니다!')
        } else {
          // 다운로드로 대체
          const link = document.createElement('a')
          link.href = url
          link.download = `angella-style-report-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      // 사용자가 공유를 취소한 경우 에러 무시
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || '공유 중 오류가 발생했습니다.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const filteredWardrobe = WARDROBE_ITEMS.filter(item => {
    const matchesCategory = wardrobeCategory === 'All' || item.category === wardrobeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // 결제 완료 후 자동으로 분석 시작
  useEffect(() => {
    if (isPaid) {
      // localStorage에서 사용자 데이터 복원
      const savedData = localStorage.getItem('angella_user_data')
      if (savedData) {
        try {
          const userData = JSON.parse(savedData)
          setPhoto(userData.photo || null)
          setHeight(userData.height || '')
          setWeight(userData.weight || '')
          setSelectedStyle(userData.selectedStyle || 'minimal')
          setSelectedColor(userData.selectedColor || 'neutral')
          setSelectedOccasions(userData.selectedOccasions || ['daily'])

          // 데이터 복원 후 분석 시작 (약간의 딜레이 후)
          setTimeout(() => {
            window.history.replaceState({}, '', '/')
            localStorage.removeItem('angella_user_data')
          }, 100)
        } catch (e) {
          console.error('Failed to restore user data:', e)
        }
      }
    }
  }, [isPaid])

  // 결제 완료 후 데이터 복원되면 분석 시작
  useEffect(() => {
    if (isPaid && photo && height && weight && !loading) {
      runAnalysis()
    }
  }, [isPaid, photo, height, weight])

  // Loading View (결제 완료 후 분석 중)
  if (loading && isPaid) {
    return (
      <div className="app-container">
        <main className="home-main" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '24px' }}>
          <div className="loading-content" style={{ flexDirection: 'column', gap: '24px' }}>
            <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
            <h1 className="page-title">AI가 분석 중입니다</h1>
            <p className="page-subtitle">
              입력하신 정보를 바탕으로<br />맞춤 스타일을 분석하고 있습니다.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Wardrobe View
  if (activeTab === 'wardrobe') {
    return (
      <div className="app-container">
        <header className="wardrobe-header">
          <button className="icon-btn">
            <span className="material-icon">settings</span>
          </button>
          <h1 className="header-title">My Wardrobe</h1>
          <button className="icon-btn">
            <span className="material-icon">share</span>
          </button>
        </header>

        <main className="wardrobe-main">
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar">
              <span className="material-icon search-icon">search</span>
              <input
                type="text"
                placeholder="Search clothes or outfits"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            <div className="tabs-container">
              {['All', 'Work', 'Date', 'Weekend'].map((cat) => (
                <button
                  key={cat}
                  className={`tab-btn ${wardrobeCategory === cat ? 'active' : ''}`}
                  onClick={() => setWardrobeCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Wardrobe Grid */}
          <div className="wardrobe-grid">
            {filteredWardrobe.map((item) => (
              <WardrobeCard key={item.id} item={item} />
            ))}
          </div>
        </main>

        {/* FAB */}
        <button className="fab-button">
          <span className="material-icon">auto_awesome</span>
        </button>

        <footer className="app-footer">
          <NavItem icon="home" label="Home" active={false} onClick={() => handleNavClick('home')} />
          <NavItem icon="checkroom" label="Wardrobe" active={true} filled onClick={() => handleNavClick('wardrobe')} />
          <NavItem icon="analytics" label="Metrics" active={false} onClick={() => handleNavClick('metrics')} />
          <NavItem icon="person" label="Profile" active={false} onClick={() => handleNavClick('profile')} />
        </footer>
      </div>
    )
  }

  // Report View
  if (report) {
    return (
      <div className="app-container">
        <header className="profile-header">
          <button className="back-btn" onClick={handleReset}>
            <span className="material-icon">arrow_back_ios</span>
          </button>
          <h2 className="header-title">Style Report</h2>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleSaveImage} disabled={isSaving} title="이미지로 저장">
              <span className="material-icon">download</span>
            </button>
            <button className="icon-btn" onClick={handleShare} disabled={isSaving} title="공유하기">
              <span className="material-icon">share</span>
            </button>
          </div>
        </header>

        <main className="report-main">
          <div className="report-capture-area" ref={reportRef}>
            <div className="report-hero">
              <div className="report-logo">ANGELLA</div>
              <h1 className="page-title">Your Personalized</h1>
              <h1 className="page-title"><span className="text-primary">Style Guide</span></h1>
              <p className="page-subtitle">AI가 추천하는 당신만의 패션 스타일 가이드입니다.</p>
            </div>

            <div className="report-card">
              <div className="report-content">
                {report.split('\n').map((line, index) => {
                  if (line.startsWith('##')) {
                    return <h2 key={index} className="report-h2">{line.replace(/^##\s*/, '')}</h2>
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <h3 key={index} className="report-h3">{line.replace(/\*\*/g, '')}</h3>
                  }
                  if (line.match(/^\d+\.\s*\*\*/)) {
                    return (
                      <h3 key={index} className="report-h3">
                        {line.replace(/^\d+\.\s*\*\*/, '').replace(/\*\*.*$/, '')}
                      </h3>
                    )
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <li key={index} className="report-li">{line.replace(/^[-*]\s*/, '')}</li>
                  }
                  if (line.trim() === '') {
                    return <br key={index} />
                  }
                  return <p key={index} className="report-p">{line}</p>
                })}
              </div>

              {photo && (
                <div className="my-photo-section">
                  <h2 className="section-title">
                    <span className="material-icon text-primary">person</span>
                    분석된 사진
                  </h2>
                  <img src={photo} alt="내 사진" className="my-photo-image" />
                </div>
              )}
            </div>

            <div className="report-watermark">
              <span className="material-icon">auto_awesome</span>
              <span>Powered by ANGELLA AI</span>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
        </main>

        <div className="bottom-action">
          <div className="bottom-action-row">
            <button onClick={handleSaveImage} className="btn-secondary" disabled={isSaving}>
              {isSaving ? <span className="spinner"></span> : <span className="material-icon">download</span>}
              이미지 저장
            </button>
            <button onClick={handleShare} className="btn-secondary" disabled={isSaving}>
              {isSaving ? <span className="spinner"></span> : <span className="material-icon">share</span>}
              공유하기
            </button>
          </div>
          <button onClick={handleReset} className="btn-primary">
            <span className="material-icon">refresh</span>
            다시 분석하기
          </button>
        </div>
      </div>
    )
  }

  // Photo Analysis View (Step 1)
  if (currentStep === 1) {
    return (
      <div className="app-container mobile-frame">
        <header className="profile-header">
          <button className="back-btn" onClick={() => setCurrentStep(0)}>
            <span className="material-icon">arrow_back_ios</span>
          </button>
          <h2 className="header-title">Photo Analysis</h2>
          <div className="header-right"></div>
        </header>

        <main className="photo-analysis-main">
          <div className="analysis-headline">
            <h3 className="analysis-title">Let's find your perfect fit</h3>
            <p className="analysis-subtitle">Follow the guidelines for the most accurate body proportion analysis.</p>
          </div>

          <div className="scan-zone-wrapper">
            <div
              className={`scan-zone ${isDragging ? 'dragging' : ''} ${photo ? 'has-photo' : ''} ${isAnalyzing ? 'analyzing' : ''}`}
              onClick={handlePhotoClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {photo && (
                <div className="scan-bg-image" style={{ backgroundImage: `url(${photo})` }}></div>
              )}

              {(photo && isAnalyzing) && (
                <>
                  <div className="scanning-line"></div>
                  <div className="analysis-point point-1">
                    <div className="point-dot"></div>
                    <div className="point-line-v"></div>
                  </div>
                  <div className="analysis-point point-2">
                    <div className="point-dot"></div>
                    <div className="point-line-h"></div>
                  </div>
                </>
              )}

              <div className="scan-content">
                {!photo ? (
                  <>
                    <span className="material-icon scan-icon">add_a_photo</span>
                    <p className="scan-title">{isDragging ? '여기에 놓으세요' : 'Upload Your Photo'}</p>
                    <p className="scan-hint">Tap or drag to upload</p>
                  </>
                ) : isAnalyzing ? (
                  <>
                    <span className="material-icon scan-icon scanning">qr_code_scanner</span>
                    <p className="scan-title">Analyzing Your Style</p>
                    <p className="scan-hint">Detecting colors and features...</p>
                  </>
                ) : (
                  <>
                    <span className="material-icon scan-icon success">check_circle</span>
                    <p className="scan-title">Analysis Complete</p>
                    <p className="scan-hint">Tap to change photo</p>
                  </>
                )}
              </div>

              {isAnalyzing && (
                <div className="scan-progress">
                  <div className="scan-progress-fill"></div>
                </div>
              )}
            </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" hidden />

          {/* 키, 몸무게 입력 */}
          <div className="body-metrics-section">
            <h4 className="section-title">
              <span className="material-icon text-primary">straighten</span>
              신체 정보
            </h4>
            <div className="metrics-inputs">
              <div className="metric-input-group">
                <label htmlFor="height">키 (cm)</label>
                <input
                  type="number"
                  id="height"
                  placeholder="170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="metric-input"
                />
              </div>
              <div className="metric-input-group">
                <label htmlFor="weight">몸무게 (kg)</label>
                <input
                  type="number"
                  id="weight"
                  placeholder="65"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="metric-input"
                />
              </div>
            </div>
          </div>

          <div className="checklist-section">
            <h4 className="checklist-title">Photo Tips</h4>
            <div className="checklist-card">
              <ChecklistItem checked={true} text="Use natural lighting for accurate colors" />
              <ChecklistItem checked={true} text="Show your face and outfit clearly" />
              <ChecklistItem checked={!!photo} text="Upload a recent photo" />
            </div>
          </div>

          <div className="reference-section">
            <h4 className="reference-title">Reference Examples</h4>
            <div className="reference-grid">
              <div className="reference-card correct">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" alt="Correct pose" />
                <div className="reference-badge correct">
                  <span className="material-icon">done</span>
                </div>
                <p className="reference-label">Correct: Neutral Pose</p>
              </div>
              <div className="reference-card incorrect">
                <img src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400" alt="Incorrect pose" />
                <div className="reference-badge incorrect">
                  <span className="material-icon">close</span>
                </div>
                <p className="reference-label">Incorrect: Too Baggy</p>
              </div>
            </div>
          </div>

          <div className="privacy-footer">
            <div className="privacy-badge">
              <span className="material-icon">lock</span>
              <span>Encrypted & Secure</span>
            </div>
            <p className="privacy-text">Your photos are processed securely. This service provides fashion and style recommendations for entertainment purposes only.</p>
          </div>

          {error && <p className="error-text">{error}</p>}
        </main>

        <div className="bottom-action">
          <button
            className="btn-primary"
            onClick={() => photo && !isAnalyzing && height && weight && setCurrentStep(2)}
            disabled={!photo || isAnalyzing || !height || !weight}
          >
            {isAnalyzing ? (
              <><span className="spinner"></span>Analyzing...</>
            ) : photo && height && weight ? (
              <>Continue to Style<span className="material-icon">arrow_forward</span></>
            ) : !photo ? (
              <><span className="material-icon">photo_camera</span>Upload Photo</>
            ) : (
              <><span className="material-icon">straighten</span>Enter Height & Weight</>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Style Preferences View (Step 2)
  if (currentStep === 2) {
    return (
      <div className="app-container mobile-frame">
        <header className="profile-header">
          <button className="back-btn" onClick={() => setCurrentStep(1)}>
            <span className="material-icon">arrow_back_ios</span>
          </button>
          <h2 className="header-title">Style Preferences</h2>
          <span className="step-indicator">2/2</span>
        </header>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '100%' }}></div>
        </div>

        <main className="form-main">
          <div className="page-header">
            <h1 className="page-title">Define Your Style</h1>
            <p className="page-subtitle">선호하는 스타일을 알려주시면 맞춤 추천을 드립니다.</p>
          </div>

          {/* Occasion Selection */}
          <section className="metrics-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="material-icon text-primary">event</span>
                When do you dress up?
              </h3>
            </div>
            <div className="occasion-grid">
              {OCCASION_OPTIONS.map((occasion) => (
                <button
                  key={occasion.id}
                  className={`occasion-btn ${selectedOccasions.includes(occasion.id) ? 'selected' : ''}`}
                  onClick={() => toggleOccasion(occasion.id)}
                >
                  <span className="material-icon">{occasion.icon}</span>
                  <span>{occasion.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Color Preference */}
          <section className="metrics-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="material-icon text-primary">palette</span>
                Color Preference
              </h3>
            </div>
            <div className="color-options">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.id}
                  className={`color-option ${selectedColor === color.id ? 'selected' : ''}`}
                  onClick={() => setSelectedColor(color.id)}
                >
                  <span className="color-label">{color.label}</span>
                  <span className="color-desc">{color.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Style Selection */}
          <section className="style-section">
            <h3 className="section-title">
              <span className="material-icon text-primary">style</span>
              Select Your Vibe
            </h3>
            <div className="style-grid">
              {STYLE_OPTIONS.map((style) => (
                <div key={style.id} className={`style-card ${selectedStyle === style.id ? 'selected' : ''}`} onClick={() => setSelectedStyle(style.id)}>
                  <img src={style.image} alt={style.label} className="style-image" />
                  <div className="style-gradient"></div>
                  <div className="style-label">
                    {selectedStyle === style.id && <span className="material-icon check-icon">check_circle</span>}
                    <span>{style.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && <p className="error-text">{error}</p>}
        </main>

        <div className="bottom-action">
          <button className="btn-primary" onClick={handleCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? (
              <><span className="spinner"></span>Processing...</>
            ) : (
              <>
                <span className="material-icon">diamond</span>
                결제하고 분석 결과 받기
              </>
            )}
          </button>
          <p className="checkout-hint">입력한 정보를 기반으로 AI가 맞춤 스타일을 분석합니다</p>
        </div>
      </div>
    )
  }

  // Home View (Step 0)
  return (
    <div className="app-container">
      <header className="app-header">
        <button className="icon-btn">
          <span className="material-icon">menu</span>
        </button>
        <h2 className="header-title">ANGELLA</h2>
        <button className="icon-btn avatar-btn">
          <span className="material-icon">account_circle</span>
        </button>
      </header>

      <main className="home-main home-scrollable">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-image">
            <div className="hero-gradient"></div>
            <div className="hero-content">
              <h1 className="hero-title">
                Discover your <br /><span className="text-primary italic">perfect</span> style with AI
              </h1>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="cta-section">
          <button className="btn-primary" onClick={() => setCurrentStep(1)}>
            <span className="material-icon">auto_awesome</span>
            스타일 분석 시작하기
          </button>
        </div>

        {/* What You Get Section */}
        <div className="info-section">
          <h2 className="info-section-title">What You Get</h2>

          <div className="info-card">
            <div className="info-card-icon">
              <span className="material-icon">palette</span>
            </div>
            <div className="info-card-content">
              <h3>Personal Color Analysis</h3>
              <ul>
                <li>AI가 사진에서 피부톤과 특성을 분석</li>
                <li>나에게 어울리는 맞춤 컬러 팔레트 제공</li>
                <li>입어야 할 색상과 피해야 할 색상 안내</li>
              </ul>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-icon">
              <span className="material-icon">checkroom</span>
            </div>
            <div className="info-card-content">
              <h3>Style Recommendations</h3>
              <ul>
                <li>선호 스타일 기반 맞춤 코디 추천</li>
                <li>일상, 오피스, 데이트, 파티별 룩 제안</li>
                <li>액세서리 및 스타일링 팁</li>
              </ul>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-icon">
              <span className="material-icon">face</span>
            </div>
            <div className="info-card-content">
              <h3>Hairstyle Suggestions</h3>
              <ul>
                <li>얼굴형에 맞는 AI 헤어스타일 추천</li>
                <li>9가지 스타일 옵션 비주얼 제공</li>
                <li>다양한 길이, 컬러, 텍스처 탐색</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="info-section">
          <h2 className="info-section-title">How It Works</h2>

          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Upload</h4>
                <p>선명한 사진을 촬영하거나 업로드하세요</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Customize</h4>
                <p>스타일 선호도와 상황을 선택하세요</p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Receive</h4>
                <p>맞춤형 AI 스타일 가이드를 즉시 받으세요</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="info-section">
          <h2 className="info-section-title">Delivery</h2>

          <div className="delivery-grid">
            <div className="delivery-item">
              <span className="material-icon">bolt</span>
              <span>즉시 제공</span>
            </div>
            <div className="delivery-item">
              <span className="material-icon">devices</span>
              <span>모든 기기</span>
            </div>
            <div className="delivery-item">
              <span className="material-icon">download</span>
              <span>다운로드 가능</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="home-footer-note">
          <p>이 서비스는 패션 및 스타일 추천을 위한 엔터테인먼트 목적으로 제공됩니다.</p>
          <div className="powered-by">
            <span className="material-icon">auto_awesome</span>
            <span>Powered by AI. Styled for you.</span>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
      </main>

      <footer className="app-footer">
        <NavItem icon="home" label="Home" active={activeTab === 'home'} onClick={() => handleNavClick('home')} />
        <NavItem icon="checkroom" label="Wardrobe" active={activeTab === 'wardrobe'} onClick={() => handleNavClick('wardrobe')} />
        <NavItem icon="analytics" label="Metrics" active={activeTab === 'metrics'} onClick={() => handleNavClick('metrics')} />
        <NavItem icon="person" label="Profile" active={activeTab === 'profile'} onClick={() => handleNavClick('profile')} />
      </footer>
    </div>
  )
}

function WardrobeCard({ item }: { item: typeof WARDROBE_ITEMS[0] }) {
  const [liked, setLiked] = useState(item.liked)

  return (
    <div className="wardrobe-card">
      <div className="card-image-wrapper">
        <img src={item.image} alt={item.name} className="card-image" />
        <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)}>
          <span className="material-icon">favorite</span>
        </button>
      </div>
      <div className="card-info">
        <p className="card-category">{item.category}</p>
        <p className="card-name">{item.name}</p>
      </div>
    </div>
  )
}

function ChecklistItem({ checked, text }: { checked: boolean; text: string }) {
  return (
    <label className="checklist-item">
      <div className={`checklist-checkbox ${checked ? 'checked' : ''}`}>
        {checked && <span className="material-icon">check</span>}
      </div>
      <p>{text}</p>
    </label>
  )
}

function NavItem({ icon, label, active, filled, onClick }: { icon: string; label: string; active?: boolean; filled?: boolean; onClick?: () => void }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className={`material-icon ${filled && active ? 'filled' : ''}`}>{icon}</span>
      <span className="nav-label">{label}</span>
    </div>
  )
}

export default App

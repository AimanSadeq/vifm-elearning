'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

interface VideoPreviewProps {
  src: string
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export function VideoPreview({ src }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    setShowControls(true)
    if (isPlaying) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
        setShowSpeedMenu(false)
      }, 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleTimeUpdate = () => { setCurrentTime(video.currentTime); setDuration(video.duration) }
    const handlePlay = () => { setIsPlaying(true); resetHideTimer() }
    const handlePause = () => { setIsPlaying(false); setShowControls(true); if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current) }
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    return () => { video.removeEventListener('timeupdate', handleTimeUpdate); video.removeEventListener('play', handlePlay); video.removeEventListener('pause', handlePause); if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current) }
  }, [resetHideTimer])

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  const togglePlay = () => { if (videoRef.current) { if (isPlaying) { videoRef.current.pause() } else { videoRef.current.play() } } }
  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted) } }
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { const t = parseFloat(e.target.value); if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t) } }
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) { videoRef.current.volume = v; setIsMuted(v === 0) } }
  const handleSpeedChange = (speed: number) => { setPlaybackSpeed(speed); if (videoRef.current) videoRef.current.playbackRate = speed; setShowSpeedMenu(false) }
  const toggleFullscreen = () => { if (containerRef.current) { if (document.fullscreenElement) { document.exitFullscreen() } else { containerRef.current.requestFullscreen() } } }
  const formatTime = (s: number) => { if (isNaN(s)) return '0:00'; return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}` }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-lg" onMouseMove={resetHideTimer} onMouseEnter={resetHideTimer} onMouseLeave={() => { if (isPlaying) { setShowControls(false); setShowSpeedMenu(false) } }}>
      <video ref={videoRef} src={src} className="h-full w-full" onClick={togglePlay} style={{ objectFit: 'contain' }}>Your browser does not support the video tag.</video>
      {!isPlaying && (
        <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 transition-opacity" onClick={togglePlay}>
          <div className="rounded-full bg-white/20 p-6 backdrop-blur-sm transition-transform hover:scale-110"><Play className="h-16 w-16 text-white drop-shadow-lg" fill="white" /></div>
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent px-4 pb-3 pt-12 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="relative mb-3">
          <input type="range" min={0} max={duration || 0} value={currentTime} onChange={handleSeek} className="h-1 w-full cursor-pointer appearance-none rounded-full" aria-label="Video progress" style={{ background: `linear-gradient(to right, #5391D5 0%, #5391D5 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)` }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="rounded p-1.5 text-white transition-colors hover:bg-white/10" aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
            <div className="text-xs font-medium text-white">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="rounded p-1.5 text-white transition-colors hover:bg-white/10" aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={handleVolumeChange} className="hidden h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 accent-white sm:block" aria-label="Volume" />
            </div>
            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="rounded px-2 py-1 text-xs font-bold text-white transition-colors hover:bg-white/10" aria-label="Playback speed">{playbackSpeed}x</button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 rounded-lg bg-black/90 py-1 shadow-lg backdrop-blur-sm">
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button key={speed} onClick={() => handleSpeedChange(speed)} className={`block w-full px-4 py-1.5 text-left text-xs transition-colors ${speed === playbackSpeed ? 'bg-white/20 font-bold text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>{speed}x</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={toggleFullscreen} className="rounded p-1.5 text-white transition-colors hover:bg-white/10" aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>{isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

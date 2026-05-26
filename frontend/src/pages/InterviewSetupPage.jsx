/* ── InterviewSetupPage — Camera & Mic check before interview ─── */
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, CameraOff, Mic, MicOff, CheckCircle2,
  XCircle, Loader2, Play, ChevronLeft, Brain, Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Countdown Overlay ──────────────────────────────────────── */
function CountdownOverlay({ onDone }) {
  const [count, setCount] = useState(3);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (count === 0) { onDoneRef.current(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);


  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <p className="text-muted-foreground text-lg mb-6 font-medium tracking-widest uppercase">
        Interview starts in
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          className="font-bold text-white"
          style={{ fontSize: count === 0 ? 56 : 120, lineHeight: 1, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {count === 0 ? 'GO!' : count}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Check Row ───────────────────────────────────────────────── */
function CheckRow({ icon: Icon, label, status }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
           style={{ background: 'var(--bg-elevated)' }}>
        <Icon size={16} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <span className="flex-1 text-sm text-foreground">{label}</span>
      {status === 'checking' && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
      {status === 'ok'       && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
      {status === 'error'    && <XCircle size={18} style={{ color: '#ef4444' }} />}
      {status === 'idle'     && <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--sidebar-border)' }} />}
    </div>
  );
}

/* ── Main Setup Page ─────────────────────────────────────────── */
export default function InterviewSetupPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef   = useRef(null);

  const sessionConfig = location.state ?? {
    category: { id: 'technical', label: 'Technical', emoji: '💻' },
    role: 'Frontend Developer', difficulty: 'beginner', duration: 20,
  };

  const [camStatus, setCamStatus]  = useState('idle');   // idle|checking|ok|error
  const [micStatus, setMicStatus]  = useState('idle');
  const [micLevel,  setMicLevel]   = useState(0);        // 0-100
  const [cameraOn,  setCameraOn]   = useState(true);
  const [micOn,     setMicOn]      = useState(true);
  const [countdown, setCountdown]  = useState(false);

  const allOk = camStatus === 'ok' && micStatus === 'ok';

  const isMountedRef = useRef(true);

  /* ── Request camera + mic permissions ─────────────────────── */
  useEffect(() => {
    isMountedRef.current = true;
    initDevices();
    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, []);

  async function initDevices() {
    setCamStatus('checking');
    setMicStatus('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(t => t.stop());
        } catch (e) {}
      }
      streamRef.current = stream;

      // Video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCamStatus('ok');

      // Mic level analyser
      const ctx  = new AudioContext();
      const src  = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      setMicStatus('ok');
      animateMicLevel();
    } catch (err) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera/Mic access denied. Please allow permissions.');
      } else {
        toast.error('Could not access camera/mic.');
      }
      setCamStatus('error');
      setMicStatus('error');
    }
  }

  function animateMicLevel() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }

  function stopStream() {
    cancelAnimationFrame(animRef.current);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function toggleCamera() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !cameraOn;
    setCameraOn(c => !c);
  }

  function toggleMic() {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !micOn;
    setMicOn(m => !m);
  }

  function handleStart() {
    if (!allOk) { toast.error('Please allow camera and microphone access first.'); return; }
    stopStream();
    setCountdown(true);
  }

  function handleCountdownDone() {
    navigate('/interview/session', { state: sessionConfig });
  }

  const { category, role, difficulty, duration } = sessionConfig;

  return (
    <>
      {countdown && <CountdownOverlay onDone={handleCountdownDone} />}

      <div className="min-h-screen flex items-center justify-center p-4"
           style={{ background: 'var(--bg-base)' }}>
        <motion.div
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Back */}
          <button
            onClick={() => { stopStream(); navigate('/practice'); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Practice
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                 style={{ background: 'var(--gradient-brand)' }}>
              <Brain size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Interview Setup</h1>
              <p className="text-sm text-muted-foreground">
                {category?.emoji} {category?.label} · {role} ·{' '}
                <span className="capitalize">{difficulty}</span> · {duration} min
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Camera Preview ───────────────────────────────── */}
            <div>
              <div className="relative rounded-2xl overflow-hidden aspect-video"
                   style={{ background: '#0a0a0f', border: '1px solid var(--sidebar-border)' }}>
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)', display: cameraOn ? 'block' : 'none' }}
                />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <CameraOff size={40} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm text-muted-foreground">Camera is off</span>
                  </div>
                )}

                {/* Camera status badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                     style={{ background: 'rgba(0,0,0,0.7)', color: camStatus === 'ok' ? '#10b981' : '#ef4444' }}>
                  <div className="w-1.5 h-1.5 rounded-full"
                       style={{ background: camStatus === 'ok' ? '#10b981' : '#ef4444',
                                animation: camStatus === 'ok' ? 'pulse 2s infinite' : 'none' }} />
                  {camStatus === 'ok' ? 'Camera OK' : camStatus === 'checking' ? 'Checking…' : 'No Camera'}
                </div>

                {/* Camera controls */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <button
                    onClick={toggleCamera}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: cameraOn ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.8)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                    }}
                  >
                    {cameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
                  </button>
                  <button
                    onClick={toggleMic}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: micOn ? 'rgba(255,255,255,0.15)' : 'rgba(239,68,68,0.8)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                    }}
                  >
                    {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                </div>
              </div>

              {/* Mic level bar */}
              <div className="mt-3 flex items-center gap-3">
                <Volume2 size={14} style={{ color: 'var(--text-muted)' }} />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: micLevel > 60 ? '#10b981' : micLevel > 20 ? '#f59e0b' : 'var(--brand-primary)' }}
                    animate={{ width: `${micLevel}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground w-8">{micLevel}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">Speak something to test your microphone</p>
            </div>

            {/* ── Right Panel ──────────────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Device check */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--sidebar-border)' }}>
                <h3 className="text-sm font-semibold text-foreground mb-3">Device Check</h3>
                <div className="divide-y" style={{ borderColor: 'var(--sidebar-border)' }}>
                  <CheckRow icon={Camera}  label="Camera"     status={camStatus} />
                  <CheckRow icon={Mic}     label="Microphone" status={micStatus} />
                  <CheckRow icon={Volume2} label="Speakers"   status={camStatus === 'ok' ? 'ok' : 'idle'} />
                </div>
                {(camStatus === 'error' || micStatus === 'error') && (
                  <button
                    onClick={initDevices}
                    className="mt-3 w-full py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
                  >
                    Retry Permissions
                  </button>
                )}
              </div>

              {/* Interview info */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--sidebar-border)' }}>
                <h3 className="text-sm font-semibold text-foreground mb-3">Interview Details</h3>
                <div className="space-y-2.5">
                  {[
                    ['Category', `${category?.emoji} ${category?.label}`],
                    ['Role', role],
                    ['Difficulty', difficulty],
                    ['Duration', `${duration} minutes`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground capitalize">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl p-5" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <h3 className="text-sm font-semibold text-purple-400 mb-2">💡 Tips Before You Start</h3>
                <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Structure answers using the <strong className="text-foreground">STAR method</strong></li>
                  <li>• You can skip questions and return to them</li>
                  <li>• The session will auto-submit when time runs out</li>
                </ul>
              </div>

              {/* Start button */}
              <motion.button
                onClick={handleStart}
                disabled={!allOk}
                className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2.5 text-sm transition-all"
                style={{
                  background: allOk ? 'var(--gradient-brand)' : 'var(--bg-elevated)',
                  color: allOk ? 'white' : 'var(--text-muted)',
                  boxShadow: allOk ? '0 4px 24px rgba(124,58,237,0.4)' : 'none',
                  cursor: allOk ? 'pointer' : 'not-allowed',
                }}
                whileHover={allOk ? { scale: 1.02 } : {}}
                whileTap={allOk ? { scale: 0.98 } : {}}
              >
                <Play size={18} />
                {allOk ? 'Start Interview' : 'Waiting for permissions…'}
              </motion.button>

              {!allOk && camStatus !== 'checking' && (
                <p className="text-center text-xs text-red-400">
                  Allow camera & microphone access in your browser to continue.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

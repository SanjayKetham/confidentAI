/* ── InterviewSessionPage — Live Mercor-Style AI Interview ─────────── */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Clock, ChevronRight, ChevronLeft,
  SkipForward, Brain, Loader2, Flag, CheckCircle2,
  Camera, CameraOff, RotateCcw, Lightbulb, Volume2,
  VolumeX, Sparkles, MessageSquare, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { questionsAPI, aiInterviewAPI } from '../utils/api';
import './InterviewSession.css';

/* ── Speech Synthesis Helper ────────────────────────────────────────── */
function speakText(text, voiceName = 'Google US English', onEnd = () => {}) {
  if (!window.speechSynthesis) return;
  
  // Cancel any ongoing speech to clear the queue
  window.speechSynthesis.cancel();

  // Strip all markdown symbols (*, _, #, `, etc.) so the audio reader speaks naturally
  const cleanText = String(text).replace(/[\*\#\_`]/g, '').trim();

  // Use a safety buffer delay to prevent Chrome's SpeechSynthesis engine queue lockup bug
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Find a good premium voice if available
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name.includes(voiceName) || v.lang.startsWith('en-US')) || voices[0];
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1.05; // Slightly faster for natural cadence
    utterance.pitch = 1.02;
    utterance.onend = onEnd;
    
    window.speechSynthesis.speak(utterance);
  }, 120);
}

export default function InterviewSessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { category, role, difficulty, duration, resumeFocus, skills } = location.state ?? {
    category: { id: 'technical', label: 'Technical', emoji: '💻' },
    role: 'Frontend Developer', difficulty: 'beginner', duration: 20,
    resumeFocus: false, skills: [],
  };

  const totalTime = (duration ?? 20) * 60;

  // Question & State management
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [answers, setAnswers] = useState({});
  const [textAnswer, setTextAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Speech & Voice states
  const [inputMode, setInputMode] = useState('voice'); // voice | text
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Real-time dynamic coaching state
  const [coachingFeedback, setCoachingFeedback] = useState('');
  const [userSpeakingState, setUserSpeakingState] = useState('idle'); // 'idle' | 'speaking' | 'paused'
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  
  // Dynamic AI Evaluations state
  const [aiEvaluations, setAiEvaluations] = useState([]);
  
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pendingFeedbackRef = useRef('');
  const lastSpokenIndexRef = useRef(-1);


  // ── Fetch First Question (Dynamic AI Mode) ──
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await aiInterviewAPI.start({
          category: category?.id,
          role,
          difficulty,
          resumeFocus: resumeFocus || false,
          skills: skills || [],
        });
        
        if (!active) return;

        if (response.data?.success) {
          const qData = response.data.data;
          setQuestions([
            {
              _id: '1',
              text: qData.question,
              topic: qData.topic || 'Introduction',
              hint: qData.hint || 'Break down your answer logically.',
              tags: [category?.label || 'General', difficulty],
            }
          ]);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        if (!active) return;
        console.error('Failed to start AI interview:', err);
        toast.error('Failed to load AI Interview. Loading backup session.');
        setQuestions([
          { _id: '1', text: 'Tell me about yourself, your career path, and why you are interested in this position.', hint: 'Keep it structured: Past → Present → Future goals.', topic: 'Introduction', tags: ['Behavioral', 'Intro'] },
          { _id: '2', text: 'How do you handle technical debt or legacy code challenges in a fast-paced team environment?', hint: 'Provide concrete strategies for prioritization.', topic: 'Teamwork', tags: ['Agile', 'Engineering'] },
          { _id: '3', text: 'Explain the core architectural difference between server-side rendering (SSR) and client-side rendering (CSR).', hint: 'Compare initial load time, SEO, and server load.', topic: 'Architecture', tags: ['Web Perf', 'React'] },
          { _id: '4', text: 'Describe a situation where you had a strong disagreement with a technical decision made by your lead. How did you resolve it?', hint: 'Focus on communication, professionalism, and compromisation.', topic: 'Conflict Resolution', tags: ['Behavioral', 'Leadership'] }
        ]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    
    // Warm up speech synthesis voices
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      active = false;
    };
  }, [category?.id, difficulty, role]);

  // ── Camera and Mic Stream Setup for Split Screen ──
  useEffect(() => {
    if (loading) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(s => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Camera/Mic check error:', err);
        toast.error('Camera or Microphone access not granted. Running in simulator mode.');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [loading]);

  // ── Timer Logic ──
  useEffect(() => {
    if (loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          handleFinish();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  const currentQ = questions[qIndex];

  // ── Speech Recognition Setup ──
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error('Web Speech API is not supported in this browser. Please type your answer.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onresult = (e) => {
      // User started/is actively speaking
      setUserSpeakingState('speaking');
      
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + ' ';
        }
      }
      if (final) {
        setTranscript(p => {
          const newTranscript = p + final;
          setTextAnswer(newTranscript);
          
          // Clear previous silence timer and reset
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          
          // Step 1: transition to 'paused' state after 1.8 seconds of silence
          silenceTimerRef.current = setTimeout(() => {
            setUserSpeakingState('paused');
            
            // Step 2: auto-submit the response after another 1.7 seconds (total 3.5 seconds)
            silenceTimerRef.current = setTimeout(() => {
              if (newTranscript.trim().split(/\s+/).filter(Boolean).length >= 2) {
                console.log("Conversational auto-flow: Silence pause limit reached. Evaluating...");
                autoSubmitAnswer(newTranscript);
              } else {
                setUserSpeakingState('idle');
              }
            }, 1700);
          }, 1800);

          return newTranscript;
        });
      }
    };

    r.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      toast.error(`Mic status: ${e.error}`);
      setRecording(false);
      setUserSpeakingState('idle');
    };

    r.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = r;
    try {
      r.start();
      setRecording(true);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
      }
    } catch (err) {
      console.error(err);
      setRecording(false);
      setUserSpeakingState('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setRecording(false);
    setUserSpeakingState('idle');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // ── AI voice synthesis trigger ──
  const speakQuestion = useCallback((qText, remark = '') => {
    if (isMuted) {
      // If muted, automatically trigger hands-free recording after a brief delay
      if (inputMode === 'voice') {
        setTimeout(() => {
          startRecording();
        }, 800);
      }
      return;
    }
    setIsAiSpeaking(true);
    const speechString = remark ? `${remark}. Here is your next question: ${qText}` : qText;
    setAiSpeechText(speechString);
    speakText(speechString, 'Google US English', () => {
      setIsAiSpeaking(false);
      // Auto-start microphone recording only if user is actively in voice mode!
      if (inputMode === 'voice') {
        startRecording();
      }
    });
  }, [isMuted, startRecording, inputMode]);

  // Trigger AI speech on first load and index change
  useEffect(() => {
    if (!loading && currentQ && currentQ.text) {
      if (lastSpokenIndexRef.current !== qIndex) {
        lastSpokenIndexRef.current = qIndex;
        if (qIndex === 0) {
          const welcome = `Hello! I am your Confident AI Interview Coach. Let's begin the interview for the ${role} position.`;
          speakQuestion(currentQ.text, welcome);
        } else {
          // Speak the new question along with the verbal feedback of the previous answer once the index transitions
          const feedback = pendingFeedbackRef.current;
          speakQuestion(currentQ.text, feedback);
          pendingFeedbackRef.current = ''; // Clear it immediately after speaking
        }
      }
    }
    return () => {
      // Safe cancel when moving off the page or during cleanup
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [qIndex, loading, role, speakQuestion, currentQ?.text]);

  // ── Conversational Auto-Flow Answer Processor ──
  const autoSubmitAnswer = async (finalAns) => {
    if (!currentQ || !finalAns || !finalAns.trim() || isAiAnalyzing) return;
    if (recording) stopRecording();
    setIsAiAnalyzing(true);
    setCoachingFeedback('');
    setCurrentEvaluation(null);
    setUserSpeakingState('idle');

    // Save answer
    setAnswers(p => ({ ...p, [currentQ._id]: finalAns.trim() }));

    try {
      // Gather previous questions & answers for context
      const prevQuestions = questions.slice(0, qIndex).map(q => q.text);
      const prevAnswers = questions.slice(0, qIndex).map(q => answers[q._id] || '');

      const response = await aiInterviewAPI.respond({
        questionText: currentQ.text,
        answerText: finalAns.trim(),
        previousQuestions: prevQuestions,
        previousAnswers: prevAnswers,
        role,
        difficulty,
        category: category?.id,
        resumeFocus: resumeFocus || false,
        skills: skills || [],
      });

      if (response.data?.success) {
        const resData = response.data.data;

        // Record evaluation details
        const evaluation = {
          questionId: currentQ._id,
          questionText: currentQ.text,
          userAnswer: finalAns.trim(),
          score: resData.score ?? 75,
          feedback: resData.improvement || 'Good explanation.',
          seniorUpgrade: resData.seniorUpgrade || 'N/A',
        };

        setAiEvaluations(prev => {
          const updated = [...prev, evaluation];
          
          // Dynamic adaptive flow: keep asking questions until the timer runs out
          const nextIndex = qIndex + 1;

          if (timeLeft > 5) {
            // Setup next adaptive question
            const nextQ = {
              _id: String(nextIndex + 1),
              text: resData.nextQuestion,
              topic: resData.nextTopic || 'Technical',
              hint: resData.nextHint || 'Add more details.',
              tags: [category?.label || 'General', difficulty],
            };
            
            setQuestions(prevQ => [...prevQ, nextQ]);
            setCoachingFeedback(`🌟 Score: ${resData.score}% | ${resData.improvement}\nUpgrade Phrasing: "${resData.seniorUpgrade}"`);
            
            // Set detailed evaluation state
            setCurrentEvaluation({
              score: resData.score ?? 75,
              feedback: resData.feedback || 'Excellent response.',
              improvement: resData.improvement || 'Provide more concrete examples.',
              seniorUpgrade: resData.seniorUpgrade || 'N/A'
            });

            setTimeout(() => {
              setQIndex(nextIndex);
              setTranscript('');
              setTextAnswer('');
              setCoachingFeedback('');
              setCurrentEvaluation(null);
              setIsAiAnalyzing(false);
            }, 5500); // 5.5 seconds visual feedback pause to view dashboard

            // Queue verbal feedback to play when index changes and next question renders
            pendingFeedbackRef.current = resData.feedback || 'Excellent response.';
          } else {
            // Timer has run out or is about to run out, finalize
            speakText("Thank you! That completes our live interview session. Generating your dynamic dashboard feedback report now.", 'Google US English');
            setTimeout(() => {
              handleFinishDynamic(updated);
            }, 3500);
          }

          return updated;
        });

      } else {
        throw new Error('API failed');
      }

    } catch (err) {
      console.error('Error in autoSubmitAnswer:', err);
      setIsAiAnalyzing(false);
      
      const words = finalAns.split(/\s+/).length;
      const mockScore = Math.min(95, Math.max(40, 50 + Math.round(words / 2)));
      
      let speechCoaching = "I've logged your explanation. Try focusing on presenting concrete metrics in your future answers.";
      setCoachingFeedback("⚠️ Connection reset. Simulated evaluation: Try providing specific scenarios with STAR framework.");
      
      setCurrentEvaluation({
        score: mockScore,
        feedback: speechCoaching,
        improvement: "Try focusing on presenting concrete metrics in your future answers using the STAR framework.",
        seniorUpgrade: 'Incorporate active technical verbs: "led", "architected", "optimized".'
      });

      const evaluation = {
        questionId: currentQ._id,
        questionText: currentQ.text,
        userAnswer: finalAns.trim(),
        score: mockScore,
        feedback: speechCoaching,
        seniorUpgrade: 'Incorporate more active technical verbs like "led", "architected", "optimized".',
      };

      setAiEvaluations(prev => {
        const updated = [...prev, evaluation];
        const nextIndex = qIndex + 1;

        if (timeLeft > 5) {
          const nextQ = {
            _id: String(nextIndex + 1),
            text: "Could you expand on the practical trade-offs of your chosen design decisions?",
            topic: "Design Decisions",
            hint: "Focus on maintainability, performance, or team collaboration trade-offs.",
            tags: [category?.label || 'General', difficulty],
          };
          setQuestions(prevQ => [...prevQ, nextQ]);
          pendingFeedbackRef.current = speechCoaching;

          setTimeout(() => {
            setQIndex(nextIndex);
            setTranscript('');
            setTextAnswer('');
            setCoachingFeedback('');
            setCurrentEvaluation(null);
          }, 4500);
        } else {
          speakText("Session finished! Generating report now.", 'Google US English');
          setTimeout(() => {
            handleFinishDynamic(updated);
          }, 3500);
        }
        return updated;
      });
    }
  };

  // ── Live Mercor-Style AI Analyzing & Interactive Feedback ──
  const processAnswerAndNext = async () => {
    const finalAns = inputMode === 'voice' ? transcript : textAnswer;
    if (!finalAns.trim()) {
      toast.error('Please speak or type an answer before proceeding!');
      return;
    }
    await autoSubmitAnswer(finalAns);
  };

  const handleFinishDynamic = (finalEvaluations) => {
    clearInterval(timerRef.current);
    if (recording) stopRecording();
    setSubmitted(true);
    setTimeout(() => {
      navigate('/interview/results', {
        state: {
          answers,
          questions: questions.map(q => ({ id: q._id, q: q.text, hint: q.hint, tags: q.tags || [] })),
          category,
          role,
          difficulty,
          duration,
          isDynamicAI: true,
          aiEvaluations: finalEvaluations,
        },
      });
    }, 1500);
  };

  const handleFinish = () => {
    clearInterval(timerRef.current);
    if (recording) stopRecording();
    setSubmitted(true);

    // Build evaluations for any unanswered/skipped questions
    const finalEvaluations = [...aiEvaluations];
    questions.forEach(q => {
      const alreadyEvaluated = finalEvaluations.some(e => e.questionId === q._id);
      if (!alreadyEvaluated) {
        const ansText = answers[q._id] || '';
        finalEvaluations.push({
          questionId: q._id,
          questionText: q.text,
          userAnswer: ansText,
          score: ansText.trim().length >= 5 ? 70 : 0,
          feedback: ansText.trim().length >= 5 ? 'Good response.' : 'Skipped/No response detected.',
          seniorUpgrade: 'N/A',
        });
      }
    });

    setTimeout(() => {
      navigate('/interview/results', {
        state: {
          answers,
          questions: questions.map(q => ({ id: q._id, q: q.text, hint: q.hint, tags: q.tags || [] })),
          category,
          role,
          difficulty,
          duration,
          isDynamicAI: true,
          aiEvaluations: finalEvaluations,
        },
      });
    }, 1500);
  };

  function formatTime(s) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a]">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl mx-auto glow"
            style={{ background: 'var(--gradient-brand)' }}
          >
            🤖
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-white font-display">Assembling AI Interview Board</h2>
            <p className="text-sm text-muted-foreground mt-2">Setting up real-time audio pipeline & questions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* ── Top Captions Card (Mercor Centered Layout) ── */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-20">
        <div className="bg-[#111] text-white border border-white/5 px-6 py-5 rounded-2xl shadow-2xl relative text-center">
          <p className="text-sm font-semibold text-slate-100 leading-relaxed">
            {currentQ ? currentQ.text : "Connecting to AI Coach..."}
          </p>
          {transcript && userSpeakingState === 'speaking' && (
            <p className="mt-2.5 text-xs text-slate-400 font-mono italic truncate max-w-lg mx-auto">
              "{transcript}"
            </p>
          )}
          {/* Draggable indicator / notch inside captions panel */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* ── Central Voice Orb (AI Host Recruiter Sphere) ── */}
      <div className="flex-1 flex items-center justify-center pointer-events-none z-0 relative">
        <div className="relative flex items-center justify-center">
          {/* Glowing dynamic circles */}
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-indigo-500/10 border border-indigo-500/20"
            animate={isAiSpeaking ? { scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] } : { scale: 1, opacity: 0.15 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-56 h-56 rounded-full bg-indigo-600/15 border border-indigo-600/20"
            animate={isAiSpeaking ? { scale: [1, 1.12, 1], opacity: [0.4, 0.9, 0.4] } : { scale: 1, opacity: 0.25 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          {/* Main concentric circle container */}
          <div className="w-40 h-40 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-400/20 relative shadow-2xl shadow-indigo-500/10">
            <motion.div
              className="w-28 h-28 rounded-full bg-indigo-500 flex items-center justify-center shadow-inner relative"
              animate={
                isAiSpeaking
                  ? { scale: [1, 1.06, 1] }
                  : userSpeakingState === 'speaking'
                    ? { scale: [1, 1.03, 1] }
                    : { scale: 1 }
              }
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {/* Inner glowing core */}
              <div className="w-10 h-10 rounded-full bg-indigo-300/40 blur-sm absolute" />
              {/* Simple avatar robot emoji representing AI */}
              <span className="text-3xl select-none z-10">🤖</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Bottom Right User Webcam Picture-in-Picture ── */}
      <div className="absolute bottom-24 right-8 z-20">
        <motion.div 
          className="w-72 md:w-80 aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md relative shadow-2xl group"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Fullscreen icon */}
          <div className="absolute top-3 left-3 w-6 h-6 rounded bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-[10px] text-white">⤢</span>
          </div>

          {/* Video Feed */}
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />

          {/* Name badge & voice visualizer */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 flex items-center gap-1.5 text-xs text-white">
            <span className="font-semibold">{user?.name || "Ketham Sanjay"}</span>
            <span className="text-slate-400 text-[10px] animate-pulse tracking-widest font-mono">
              {userSpeakingState === 'speaking' ? '.....' : '•'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Minimal Muted Hint Helper Bar ── */}
      <AnimatePresence>
        {showHint && currentQ?.hint && (
          <div className="absolute bottom-24 left-8 z-20 max-w-sm">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300/80 p-3.5 rounded-2xl flex gap-2 items-center shadow-lg backdrop-blur-sm"
            >
              <Lightbulb size={14} className="text-amber-400 flex-shrink-0" />
              <span><strong>Hint:</strong> {currentQ.hint}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Speech & Typing Input Hub (Dynamic AI & Keyboard Fallback) ── */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-20 flex flex-col gap-3 pointer-events-auto">
        
        {/* Real-time Status Banner */}
        <div className="flex justify-center">
          {isAiAnalyzing ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 shadow-lg shadow-indigo-500/5 animate-pulse uppercase tracking-wider">
              <Loader2 size={11} className="animate-spin text-indigo-400" />
              <span>Analyzing response depth & coaching...</span>
            </div>
          ) : isAiSpeaking ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-300 shadow-lg shadow-purple-500/5 uppercase tracking-wider">
              <Sparkles size={11} className="text-purple-400 animate-pulse" />
              <span>AI Coach is speaking...</span>
            </div>
          ) : recording ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 shadow-lg shadow-rose-500/5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>Mic Active — Speak now</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-white/5 text-[10px] font-bold text-slate-400 shadow-md uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              <span>Microphone Idle</span>
            </div>
          )}
        </div>

        {/* Input & Evaluation Panel */}
        <AnimatePresence mode="wait">
          {currentEvaluation ? (
            /* 🤖 Stunning AI Feedback Card 🤖 */
            <motion.div
              key="evaluation-card"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="bg-[#121216]/95 border border-indigo-500/30 rounded-2xl p-4.5 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col gap-2.5"
            >
              {/* Decorative side glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Real-time Coaching</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Gemini Response Evaluator</p>
                  </div>
                </div>
                
                {/* Score Circle/Badge */}
                <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  <span className="text-[9px] text-indigo-300 uppercase tracking-wide font-mono">Score:</span>
                  <span className="text-xs font-bold text-white font-mono">{currentEvaluation.score}%</span>
                </div>
              </div>

              {/* Encouragement & Feedback */}
              <div className="space-y-1 bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-slate-300 italic font-sans leading-relaxed">"{currentEvaluation.feedback}"</p>
                <div className="h-px bg-white/5 my-1" />
                <p className="text-[11px] text-indigo-300 leading-relaxed">
                  <strong className="text-white">Improvement:</strong> {currentEvaluation.improvement}
                </p>
              </div>

              {/* Phrasing Upgrade */}
              {currentEvaluation.seniorUpgrade && currentEvaluation.seniorUpgrade !== 'N/A' && (
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex gap-2 items-start">
                  <Sparkles size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <h5 className="text-[9px] font-bold text-amber-300 uppercase tracking-wide">Senior Phrasing Upgrade</h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {currentEvaluation.seniorUpgrade}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* ⌨️ / 🎤 Standard Input Card */
            <motion.div
              key={inputMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#111115]/90 border border-white/5 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3 relative"
            >
              {inputMode === 'voice' ? (
                /* Voice Interface Panel */
                <div className="flex flex-col gap-2.5">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 min-h-[80px] flex flex-col justify-between">
                    {transcript ? (
                      <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                        "{transcript}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">
                        Your spoken explanation will transcribe here in real-time. Start speaking when you are ready...
                      </p>
                    )}
                    
                    {/* Live Waveform Indicator (Pulse dots) */}
                    {recording && (
                      <div className="flex justify-end gap-0.5 mt-2 h-2 items-end">
                        <span className="w-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s', height: '60%' }} />
                        <span className="w-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s', height: '100%' }} />
                        <span className="w-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s', height: '40%' }} />
                        <span className="w-1 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s', height: '80%' }} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mic Toggle Button */}
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        recording
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/10'
                          : 'bg-[#212128] hover:bg-[#2d2d38] border border-white/5 text-slate-200 hover:text-white'
                      }`}
                    >
                      {recording ? <MicOff size={13} /> : <Mic size={13} />}
                      {recording ? 'Pause Microphone' : 'Start Speaking'}
                    </button>

                    {/* Manual Submit Button */}
                    <button
                      onClick={processAnswerAndNext}
                      disabled={!transcript.trim() || isAiAnalyzing || isAiSpeaking}
                      className="py-2 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1a1a24] disabled:text-slate-600 disabled:border-transparent transition-all flex items-center gap-1 text-white border border-indigo-500/20"
                    >
                      Submit Response
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  {/* Fallback Text Toggle */}
                  <div className="text-center mt-0.5">
                    <button
                      onClick={() => { stopRecording(); setInputMode('text'); }}
                      className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Keyboard not working?</span>
                      <span className="underline font-semibold text-indigo-400">Switch to Typing Mode ⌨️</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Typing Fallback Panel */
                <div className="flex flex-col gap-2.5">
                  <textarea
                    value={textAnswer}
                    onChange={(e) => {
                      setTextAnswer(e.target.value);
                      setTranscript(e.target.value); // Sync to ensure standard processing
                    }}
                    placeholder="Type your structured explanation here. Explain your technical approach logically..."
                    className="w-full bg-black/30 border border-white/5 focus:border-indigo-500/40 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none resize-none h-20 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans leading-relaxed"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      {textAnswer.trim().split(/\s+/).filter(Boolean).length} words
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Back button */}
                      <button
                        onClick={() => setInputMode('voice')}
                        className="py-1.5 px-2.5 rounded-lg text-[10px] font-bold bg-[#1a1a22] hover:bg-[#252530] text-slate-300 transition-all border border-white/5"
                      >
                        Back to Voice 🎤
                      </button>

                      {/* Submit button */}
                      <button
                        onClick={processAnswerAndNext}
                        disabled={!textAnswer.trim() || isAiAnalyzing || isAiSpeaking}
                        className="py-1.5 px-3.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1a1a24] disabled:text-slate-600 transition-all text-white flex items-center gap-0.5"
                      >
                        Submit Answer
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Elegant Dark Bottom Control Bar (Mercor Style) ── */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20 border-t border-white/5 pt-4 bg-[#1a1a1a]/40 backdrop-blur-sm px-4 rounded-xl">
        {/* Left Side: Session Metadata */}
        <div className="text-xs font-semibold text-slate-300 font-mono tracking-wide">
          {category?.label || 'System Design'} Session | {formatTime(totalTime - timeLeft)} / {formatTime(totalTime)}
        </div>

        {/* Center Toolbar: Settings, Red End Call Pill, Screen Share */}
        <div className="flex items-center gap-3">
          {/* Settings button */}
          <button 
            className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-slate-300 hover:text-white flex items-center justify-center border border-white/5 transition-all"
            title="Configure settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Red End Call Capsule button */}
          <button
            onClick={handleFinish}
            className="px-6 py-2.5 rounded-full bg-[#c92a2a] hover:bg-[#e03131] text-xs font-bold tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            End call
          </button>

          {/* Screen share button */}
          <button 
            className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-slate-300 hover:text-white flex items-center justify-center border border-white/5 transition-all"
            title="Share screen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>
        </div>

        {/* Right Side Actions: Signal indicators, Mute state, CC toggle, Help */}
        <div className="flex items-center gap-4">
          {/* Signal connection status indicator */}
          <div className="flex items-center gap-1" title="Network secure and stable">
            <svg className="w-4 h-4 text-emerald-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Mic Mute Indicator */}
          <button 
            onClick={() => {
              if (!isMuted) {
                window.speechSynthesis.cancel();
                setIsAiSpeaking(false);
              }
              setIsMuted(!isMuted);
            }}
            className={`p-2 rounded-lg border transition-all ${isMuted ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-transparent border-transparent text-slate-400 hover:text-white'}`}
            title={isMuted ? "Unmute AI Coach" : "Mute AI Coach"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* CC Toggle button */}
          <button 
            onClick={() => setShowHint(p => !p)}
            className={`w-8 h-8 rounded-lg text-[10px] font-bold border transition-all ${showHint ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-[#2a2a2a] border-white/5 text-slate-300 hover:text-white'}`}
            title="Toggle interactive structuring hints"
          >
            CC
          </button>

          {/* Help pill */}
          <button 
            className="px-4 py-2 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-xs font-bold text-slate-300 hover:text-white border border-white/5 transition-all flex items-center gap-1"
            onClick={() => toast.success("Speak naturally when the AI finishes talking. Silence auto-saves response.")}
          >
            Help <span>?</span>
          </button>
        </div>
      </div>

      {/* ── Submission overlay ── */}
      <AnimatePresence>
        {submitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#07070a]/90 backdrop-blur-md z-[100] flex items-center justify-center"
          >
            <div className="text-center space-y-6 max-w-sm px-6">
              <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-green-500/10">
                🏆
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white font-display">Interview Finalized!</h2>
                <p className="text-sm text-slate-400">Our deep AI engine is calculating your delivery scores, technical depth, and final progress insights.</p>
              </div>
              <div className="flex justify-center pt-2">
                <Loader2 size={24} className="animate-spin text-purple-400" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

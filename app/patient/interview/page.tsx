'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Clock,
  ChevronLeft,
  Loader2,
  Volume2,
  VolumeX,
  AlertTriangle,
  FileText,
  Brain,
  Sparkles,
  MessageSquare,
  X,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { ReportCompleteDialog } from '@/components/ui/ReportCompleteDialog';
import {
  ThinkingActivity,
  TypingText,
  generateThinkingSteps,
} from '@/components/ui/ThinkingActivity';
import { VoiceOrb } from '@/components/ui/VoiceOrbNew';

interface ThinkingStep {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'completed';
  details?: string;
  icon: 'database' | 'brain' | 'search' | 'file' | 'shield' | 'sparkles';
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  urdu?: string;
  timestamp: Date;
  severity?:
    | 'critical'
    | 'high'
    | 'moderate'
    | 'initial'
    | 'normal'
    | 'emergency'
    | 'urgent';
  confidenceLevel?: number;
  diseaseCount?: number;
  thinkingSteps?: ThinkingStep[];
  thinkingDuration?: number;
  isTyping?: boolean;
}

interface SessionInfo {
  id: string;
  confidenceLevel: number;
  severity: string;
  identifiedSymptoms: string[];
  isConfident: boolean;
  diseaseCount: number;
  conversationTurn: number;
}

interface DiagnosisProgress {
  initialDiseases: number;
  currentDiseases: number;
  confidence: number;
  topConditions: string[];
  symptomsIdentified: number;
}

function InterviewPageContent() {
  const [user, setUser] = useState<{
    id: string;
    name?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [patientInfo, setPatientInfo] = useState<{
    age?: number;
    gender?: string;
    chronicConditions?: string[];
  } | null>(null);

  // Voice mode states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );

  // Diagnosis tracking
  const [diagnosisProgress, setDiagnosisProgress] = useState<DiagnosisProgress>(
    {
      initialDiseases: 50,
      currentDiseases: 50,
      confidence: 0,
      topConditions: [],
      symptomsIdentified: 0,
    }
  );

  // Store actual diagnosis state from API for subsequent calls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [diagnosisState, setDiagnosisState] = useState<any>(null);

  // Thinking state for current processing
  const [currentThinkingSteps, setCurrentThinkingSteps] = useState<
    ThinkingStep[]
  >([]);
  const [thinkingStartTime, setThinkingStartTime] = useState<number>(
    Date.now()
  );

  // Show side panel on larger screens
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  // Voice mode sidebar visibility
  const [showVoiceSidebar, setShowVoiceSidebar] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const mode = searchParams?.get('mode') === 'voice' ? 'voice' : 'text';
  const router = useRouter();

  // Speech recognition ref
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  // TTS request in flight ref to prevent duplicates
  const ttsInFlightRef = useRef<boolean>(false);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        router.push('/login');
        setLoading(false);
        return;
      }
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      });

      // Fetch patient medical history
      try {
        const historyRes = await fetch('/api/medical-history');
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.medicalHistory) {
            setPatientInfo({
              age: historyData.medicalHistory.age,
              gender: historyData.medicalHistory.gender,
              chronicConditions:
                historyData.medicalHistory.chronicConditions || [],
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch medical history:', e);
      }

      // Create new clinical session
      try {
        const sessionRes = await fetch('/api/clinical-chat', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id }),
        });
        const sessionData = await sessionRes.json();
        if (sessionData.sessionId) {
          setSessionInfo({
            id: sessionData.sessionId,
            confidenceLevel: 0,
            severity: 'normal',
            identifiedSymptoms: [],
            isConfident: false,
            diseaseCount: 50,
            conversationTurn: 0,
          });
        }
      } catch (e) {
        console.error('Failed to create session:', e);
      }

      // Initialize with welcome message
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content:
          "Hello! I'm your AI health assistant. I'll ask you some questions to understand your symptoms better. What brings you here today?",
        urdu: 'السلام علیکم! میں آپ کا اے آئی ہیلتھ اسسٹنٹ ہوں۔ میں آپ کی علامات کو بہتر سمجھنے کے لیے کچھ سوالات پوچھوں گا۔ آج آپ یہاں کیوں آئے ہیں؟',
        timestamp: new Date(),
        severity: 'normal',
        confidenceLevel: 0,
        diseaseCount: 50,
        isTyping: false,
      };
      setMessages([welcomeMessage]);

      setLoading(false);
    };
    initializeSession();
  }, [router, mode]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Text-to-speech function
  const speakText = async (text: string) => {
    if (!text) return;
    // Prevent duplicate TTS calls using ref (survives React re-renders)
    if (ttsInFlightRef.current || isSpeaking || currentAudio) {
      console.log('TTS already in progress, skipping...');
      return;
    }
    ttsInFlightRef.current = true;
    setIsSpeaking(true);
    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: 'ur' }),
      });
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        const clearAudioState = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          setCurrentAudio(null);
          ttsInFlightRef.current = false;
        };
        setCurrentAudio(audio);
        audio.onended = clearAudioState;
        audio.onerror = clearAudioState;
        await audio.play();
      } else {
        setIsSpeaking(false);
        ttsInFlightRef.current = false;
      }
    } catch (e) {
      console.error('TTS failed:', e);
      setIsSpeaking(false);
      ttsInFlightRef.current = false;
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
  };

  // Speech recognition
  const getSpeechErrorMessage = (error: string) => {
    switch (error) {
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Microphone permission is blocked. Allow microphone access for localhost in your browser settings.';
      case 'audio-capture':
        return 'No microphone was found. Connect or select a microphone, then try again.';
      case 'no-speech':
        return 'I did not hear anything. Tap the mic and speak clearly.';
      case 'network':
        return 'Speech recognition could not reach the browser service. Check your internet connection.';
      default:
        return 'Microphone could not start. Check browser microphone permissions and try again.';
    }
  };

  const ensureMicrophoneAvailable = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
  };

  const startListening = async () => {
    setVoiceError('');
    stopSpeaking();

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        await ensureMicrophoneAvailable();
      } catch (error) {
        console.error('Microphone permission/device error:', error);
        setVoiceError(
          error instanceof Error
            ? error.message
            : 'Microphone permission failed. Check browser settings.'
        );
        return;
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ur-PK';
      transcriptRef.current = '';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        transcriptRef.current = transcript;
        setInputValue(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setVoiceError(getSpeechErrorMessage(event.error));
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Auto-send if we have input
        const transcript = transcriptRef.current.trim();
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition start failed:', error);
        setVoiceError('Microphone could not start. Please try again.');
      }
    } else {
      setVoiceError(
        'Speech recognition is not supported in this browser. Use Chrome or Edge for voice mode.'
      );
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Main send message handler
  const handleSendMessage = async (messageOverride?: string) => {
    const messageToSend = (messageOverride ?? inputValue).trim();
    if (!messageToSend || !user || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    transcriptRef.current = '';
    setIsLoading(true);
    setThinkingStartTime(Date.now());

    // Generate thinking steps for animation
    const thinkingSteps = generateThinkingSteps(
      sessionInfo?.confidenceLevel || 0,
      diagnosisProgress.currentDiseases
    );
    setCurrentThinkingSteps(thinkingSteps);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/clinical-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionInfo?.id,
          userId: user.id,
          conversationHistory,
          patientInfo,
          // Pass stored diagnosis state if available (from previous API response)
          diagnosisState: diagnosisState || undefined,
          conversationTurn: sessionInfo?.conversationTurn || 0,
        }),
      });

      const data = await response.json();
      const thinkingDuration = Math.round(
        (Date.now() - thinkingStartTime) / 1000
      );

      if (data.success && data.response) {
        // Calculate new disease count (narrowing down)
        const newConfidence = data.response.confidenceLevel || 0;
        const newDiseaseCount = Math.max(
          5,
          Math.round(
            diagnosisProgress.currentDiseases * (1 - newConfidence / 150)
          )
        );

        // Store the diagnosis state from API for next request
        if (data.nextState?.diagnosisState) {
          setDiagnosisState(data.nextState.diagnosisState);
        }

        // Update diagnosis progress
        setDiagnosisProgress(prev => ({
          ...prev,
          currentDiseases: newDiseaseCount,
          confidence: newConfidence,
          topConditions:
            data.response.potentialDiseases
              ?.slice(0, 5)
              .map((d: any) => d.name) || prev.topConditions,
          symptomsIdentified:
            data.response.identifiedSymptoms?.length || prev.symptomsIdentified,
        }));

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response.content,
          urdu: data.response.urdu,
          timestamp: new Date(),
          severity: data.response.severity,
          confidenceLevel: newConfidence,
          diseaseCount: newDiseaseCount,
          thinkingSteps: thinkingSteps.map(s => ({
            ...s,
            status: 'completed' as const,
          })),
          thinkingDuration,
          isTyping: true, // Enable typing animation
        };

        setMessages(prev => [...prev, aiMessage]);

        // Update session info
        setSessionInfo(prev =>
          prev
            ? {
                ...prev,
                confidenceLevel: newConfidence,
                severity: data.response.severity,
                identifiedSymptoms:
                  data.response.identifiedSymptoms || prev.identifiedSymptoms,
                isConfident: data.response.isConfident,
                diseaseCount: newDiseaseCount,
                conversationTurn: (prev.conversationTurn || 0) + 1,
              }
            : null
        );

        // Auto-speak in voice mode (after typing animation)
        if (mode === 'voice' && data.response.urdu) {
          setTimeout(() => {
            speakText(data.response.urdu);
          }, 2000); // Wait for typing animation
        }

        // Show completion popup when interview is complete (95% confidence)
        // SOAP/Safety agents are NOT triggered yet - only on user confirmation
        if (data.response.isConfident && newConfidence >= 95) {
          // Add completion message
          const completionMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content:
              'I have established a clinical narrative of your case and forwarded the Clinical Narrative Report to the doctor.',
            urdu: 'میں نے آپ کے کیس کی طبی تفصیل مرتب کر لی ہے اور کلینیکل نیریٹو رپورٹ ڈاکٹر کو بھیج دی ہے۔',
            timestamp: new Date(),
            severity: 'normal',
            confidenceLevel: newConfidence,
            isTyping: false,
          };
          setMessages(prev => [...prev, completionMessage]);

          // Speak completion message in voice mode
          if (mode === 'voice') {
            setTimeout(() => {
              speakText(completionMessage.urdu || completionMessage.content);
            }, 3000);
          }

          setTimeout(() => {
            setShowReportDialog(true);
          }, 4000);
        }
      } else {
        // Error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'I apologize, but I encountered an issue. Could you please describe your symptoms again?',
          urdu: 'معذرت، کوئی مسئلہ پیش آگیا۔ براہ کرم اپنی علامات دوبارہ بیان کریں۔',
          timestamp: new Date(),
          isTyping: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again.",
        urdu: 'کنکشن میں مسئلہ ہے۔ براہ کرم دوبارہ کوشش کریں۔',
        timestamp: new Date(),
        isTyping: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentThinkingSteps([]);
    }
  };

  const handleEndSession = () => {
    setShowEndDialog(true);
  };

  // Generate report - triggers SOAP and Safety agents
  const generateReport = async () => {
    setIsGeneratingReport(true);

    try {
      // Call API with generateReport flag to trigger SOAP/Safety agents
      const response = await fetch('/api/clinical-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate final report',
          sessionId: sessionInfo?.id,
          userId: user?.id,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          diagnosisState: diagnosisState,
          conversationTurn: sessionInfo?.conversationTurn || 0,
          generateReport: true, // This triggers SOAP + Safety agents
        }),
      });

      const data = await response.json();

      if (data.success && data.orchestration?.reportGenerated) {
        console.log('✅ Report generated:', data.orchestration.reportId);
        console.log('   Department:', data.orchestration.department);
        console.log('   Triage:', data.orchestration.triageLabel);

        // Navigate to dashboard with report info
        router.push(
          `/patient/dashboard?reportId=${data.orchestration.reportId}`
        );
      } else {
        // Still navigate but without report
        router.push('/patient/dashboard');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      router.push('/patient/dashboard');
    }
  };

  // Mark message typing as complete
  const handleTypingComplete = (messageId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, isTyping: false } : m))
    );
  };

  // Confidence color helper
  const getConfidenceColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 50) return 'text-yellow-600';
    return 'text-blue-600';
  };

  // Severity badge helper
  const getSeverityBadge = (severity: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> =
      {
        critical: { bg: 'bg-red-500', text: 'text-white', label: 'Critical' },
        emergency: { bg: 'bg-red-500', text: 'text-white', label: 'Emergency' },
        urgent: { bg: 'bg-orange-500', text: 'text-white', label: 'Urgent' },
        high: { bg: 'bg-orange-500', text: 'text-white', label: 'High' },
        moderate: {
          bg: 'bg-yellow-500',
          text: 'text-white',
          label: 'Moderate',
        },
        normal: { bg: 'bg-green-500', text: 'text-white', label: 'Stable' },
        initial: { bg: 'bg-blue-500', text: 'text-white', label: 'Initial' },
      };
    const { bg, text, label } = config[severity] || config.initial;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
      >
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: '#f2f1f3',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%233f69b8' fill-opacity='0.21' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Voice Mode UI
  if (mode === 'voice') {
    return (
      <div
        className="min-h-screen flex"
        style={{
          backgroundColor: '#f2f1f3',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%233f69b8' fill-opacity='0.21' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Main content area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header - Same as chat mode */}
          <header className="bg-[#2c4d7b] border-b border-[#1e3557] z-40 shadow-lg flex-shrink-0">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/patient/dashboard">
                  <button className="p-2 rounded-xl hover:bg-white/20 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white/10">
                    <Image
                      src="/logo/sehat-guftagu-logo.svg"
                      alt="Sehat Guftagu"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div>
                    <h1 className="font-semibold text-white">
                      Voice Interview
                    </h1>
                    <p className="text-xs text-white/70">
                      AI-powered clinical assessment
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg shadow-sm">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-medium text-white">
                    {formatTime(sessionTime)}
                  </span>
                </div>
                <button
                  onClick={handleEndSession}
                  className="px-4 py-1.5 text-sm font-medium text-red-500 bg-white rounded-xl hover:bg-red-50 transition-colors"
                >
                  End Session
                </button>
              </div>
            </div>
          </header>

          {/* Main Voice Interface */}
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
            {/* Current message display */}
            <AnimatePresence mode="wait">
              {messages.length > 0 && (
                <motion.div
                  key={messages[messages.length - 1].id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full max-w-lg mb-8"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm">
                    {messages[messages.length - 1].role === 'assistant' &&
                      isLoading && (
                        <ThinkingActivity
                          isThinking={true}
                          steps={currentThinkingSteps}
                        />
                      )}
                    <p className="text-slate-700 text-center text-lg mb-2">
                      {messages[messages.length - 1].content}
                    </p>
                    {messages[messages.length - 1].urdu && (
                      <p
                        className="font-urdu text-primary text-center text-lg"
                        dir="rtl"
                      >
                        {messages[messages.length - 1].urdu}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Orb - Disabled when AI is speaking */}
            <VoiceOrb
              isSpeaking={isSpeaking}
              isListening={isListening}
              isProcessing={isLoading}
              onStartListening={startListening}
              onStopListening={stopListening}
              disabled={isLoading || isSpeaking}
            />

            {voiceError && (
              <div className="mt-4 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                {voiceError}
              </div>
            )}

            {/* Transcription display */}
            {inputValue && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 w-full max-w-md"
              >
                <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow-sm">
                  <p className="text-slate-600 text-center">{inputValue}</p>
                  <div className="flex justify-center gap-2 mt-3">
                    <button
                      onClick={() => setInputValue('')}
                      className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </button>
                    <button
                      onClick={() => handleSendMessage()}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setShowVoiceSidebar(!showVoiceSidebar)}
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 p-2 bg-white shadow-lg rounded-l-lg border border-r-0 border-slate-200 transition-all ${showVoiceSidebar ? 'mr-80' : 'mr-0'}`}
        >
          <ChevronLeft
            className={`w-5 h-5 text-slate-600 transition-transform ${showVoiceSidebar ? '' : 'rotate-180'}`}
          />
        </button>

        {/* Right Sidebar - Analysis Progress & Agent Reasoning */}
        <AnimatePresence>
          {showVoiceSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white/90 backdrop-blur-sm border-l border-slate-200 overflow-hidden flex-shrink-0"
            >
              <div className="w-80 p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-slate-700 font-semibold">
                    Analysis Progress
                  </h2>
                  <button
                    onClick={() => setShowVoiceSidebar(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Card */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      <span className="text-slate-600 text-sm font-medium">
                        Confidence
                      </span>
                    </div>
                    <span
                      className={`text-lg font-bold ${getConfidenceColor(diagnosisProgress.confidence)}`}
                    >
                      {diagnosisProgress.confidence}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${diagnosisProgress.confidence}%` }}
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                </div>

                {/* Agent Reasoning - Current Thinking */}
                {(isLoading || currentThinkingSteps.length > 0) && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-600 mb-3">
                      {isLoading ? 'Agent Reasoning' : 'Last Analysis'}
                    </h3>
                    <ThinkingActivity
                      isThinking={isLoading}
                      steps={currentThinkingSteps}
                    />
                  </div>
                )}

                {/* Previous Message Reasoning */}
                {messages.length > 0 &&
                  messages[messages.length - 1].thinkingSteps && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                      <h3 className="text-sm font-medium text-slate-600 mb-3">
                        Previous Reasoning
                      </h3>
                      <ThinkingActivity
                        isThinking={false}
                        steps={messages[messages.length - 1].thinkingSteps!}
                        duration={
                          messages[messages.length - 1].thinkingDuration
                        }
                      />
                    </div>
                  )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                      <Sparkles className="w-3 h-3" />
                      Symptoms
                    </div>
                    <p className="text-xl font-bold text-slate-700">
                      {diagnosisProgress.symptomsIdentified}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                      <MessageSquare className="w-3 h-3" />
                      Questions
                    </div>
                    <p className="text-xl font-bold text-slate-700">
                      {sessionInfo?.conversationTurn || 0}
                    </p>
                  </div>
                </div>

                {/* Top Conditions */}
                {diagnosisProgress.topConditions.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-600 mb-3">
                      Top Conditions
                    </h3>
                    <div className="space-y-2">
                      {diagnosisProgress.topConditions.map((condition, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">
                            {i + 1}
                          </span>
                          {condition}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Session Info */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h3 className="text-sm font-medium text-slate-600 mb-3">
                    Session Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration</span>
                      <span className="text-slate-700">
                        {formatTime(sessionTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mode</span>
                      <span className="text-slate-700">Voice</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      {sessionInfo?.severity &&
                        getSeverityBadge(sessionInfo.severity)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialogs */}
        <ReportCompleteDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          sessionId={sessionInfo?.id}
        />
      </div>
    );
  }

  // Text Mode UI (ChatGPT-like)
  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundColor: '#f2f1f3',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%233f69b8' fill-opacity='0.21' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-[#2c4d7b] border-b border-[#1e3557] z-40 shadow-lg flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/patient/dashboard">
                <button className="p-2 rounded-xl hover:/90 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white/10">
                  <Image
                    src="/logo/sehat-guftagu-logo.svg"
                    alt="Sehat Guftagu"
                    width={40}
                    height={40}
                  />
                </div>
                <div>
                  <h1 className="font-semibold text-white">Health Interview</h1>
                  <p className="text-xs text-white/70">
                    AI-powered clinical assessment
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg shadow-sm">
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-sm font-medium text-white">
                  {formatTime(sessionTime)}
                </span>
              </div>
              <button
                onClick={handleEndSession}
                className="px-4 py-1.5 text-sm font-medium text-red-500 bg-white rounded-xl hover:bg-red-50 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            <AnimatePresence>
              {messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' ? (
                    <div className="flex gap-3 max-w-[85%]">
                      {/* AI Avatar */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                        <Image
                          src="/logo/sehat-guftagu-logo.svg"
                          alt="AI"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-100">
                        {/* Thinking Activity (like ChatGPT) - Now persists */}
                        {message.thinkingSteps &&
                          message.thinkingSteps.length > 0 && (
                            <ThinkingActivity
                              isThinking={false}
                              steps={message.thinkingSteps}
                              duration={message.thinkingDuration}
                            />
                          )}

                        {/* Severity Badge */}
                        {message.severity && message.severity !== 'normal' && (
                          <div className="mb-2">
                            {getSeverityBadge(message.severity)}
                          </div>
                        )}

                        {/* Message content with typing animation */}
                        <div className="text-slate-700">
                          {message.isTyping ? (
                            <TypingText
                              text={message.content}
                              speed={15}
                              onComplete={() =>
                                handleTypingComplete(message.id)
                              }
                            />
                          ) : (
                            message.content
                          )}
                        </div>

                        {/* Urdu translation */}
                        {message.urdu && !message.isTyping && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p
                              className="font-urdu text-primary text-right"
                              dir="rtl"
                            >
                              {message.urdu}
                            </p>
                            {mode === 'text' && (
                              <button
                                onClick={() => speakText(message.urdu!)}
                                disabled={isSpeaking}
                                className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors"
                              >
                                {isSpeaking ? (
                                  <VolumeX className="w-3 h-3" />
                                ) : (
                                  <Volume2 className="w-3 h-3" />
                                )}
                                Listen in Urdu
                              </button>
                            )}
                          </div>
                        )}

                        {/* Confidence indicator - hidden disease count */}
                        {message.confidenceLevel !== undefined && (
                          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                            <span
                              className={`flex items-center gap-1 ${getConfidenceColor(message.confidenceLevel)}`}
                            >
                              <Brain className="w-3 h-3" />
                              {message.confidenceLevel}% confident
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800 rounded-2xl px-4 py-3 max-w-[70%] shadow-sm">
                      <p className="text-white">{message.content}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Current thinking animation */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                  <Image
                    src="/logo/sehat-guftagu-logo.svg"
                    alt="AI"
                    width={32}
                    height={32}
                  />
                </div>
                <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-100">
                  <ThinkingActivity
                    isThinking={true}
                    steps={currentThinkingSteps}
                  />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <div className="border-t border-[#1e3557] bg-[#2c4d7b] p-4 shadow-lg flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e =>
                  e.key === 'Enter' && !isLoading && handleSendMessage()
                }
                placeholder="Describe your symptoms... / اپنی علامات بیان کریں"
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 bg-[#1e3557] border border-[#1e3557] rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Side Panel */}
      <AnimatePresence>
        {showActivityPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white/90 backdrop-blur-sm border-l border-slate-200 overflow-hidden"
          >
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-700 font-semibold">Activity</h2>
                <button
                  onClick={() => setShowActivityPanel(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Diagnosis Progress */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                <h3 className="text-sm font-medium text-slate-600 mb-3">
                  Diagnosis Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Confidence</span>
                    <span
                      className={`font-bold ${getConfidenceColor(diagnosisProgress.confidence)}`}
                    >
                      {diagnosisProgress.confidence}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${diagnosisProgress.confidence}%` }}
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
                      <p className="text-xs text-slate-400">Symptoms</p>
                      <p className="text-lg font-bold text-slate-700">
                        {diagnosisProgress.symptomsIdentified}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
                      <p className="text-xs text-slate-400">Questions</p>
                      <p className="text-lg font-bold text-slate-700">
                        {sessionInfo?.conversationTurn || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Conditions */}
              {diagnosisProgress.topConditions.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                  <h3 className="text-sm font-medium text-slate-600 mb-3">
                    Top Conditions
                  </h3>
                  <div className="space-y-2">
                    {diagnosisProgress.topConditions.map((condition, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        {condition}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="text-sm font-medium text-slate-600 mb-3">
                  Session Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-slate-700">
                      {formatTime(sessionTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Questions</span>
                    <span className="text-slate-700">
                      {sessionInfo?.conversationTurn || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    {sessionInfo?.severity &&
                      getSeverityBadge(sessionInfo.severity)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <AnimatePresence>
        {showEndDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">
                  End Session?
                </h2>
                <p className="font-urdu text-primary">
                  کیا آپ سیشن ختم کرنا چاہتے ہیں؟
                </p>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2 text-sm border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-slate-700">
                    {formatTime(sessionTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence</span>
                  <span
                    className={getConfidenceColor(diagnosisProgress.confidence)}
                  >
                    {diagnosisProgress.confidence}%
                  </span>
                </div>
              </div>

              {diagnosisProgress.confidence < 50 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 text-yellow-700 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Low confidence. Consider providing more details.
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowEndDialog(false)}
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Continue
                </Button>
                <Button
                  onClick={generateReport}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Generate Report
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportCompleteDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        sessionId={sessionInfo?.id}
      />
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            backgroundColor: '#f2f1f3',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%233f69b8' fill-opacity='0.21' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <InterviewPageContent />
    </Suspense>
  );
}

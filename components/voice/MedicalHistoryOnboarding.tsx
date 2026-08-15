'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceOrb } from './VoiceOrb';
import {
  medicalHistoryQuestions,
  Question,
  setNestedValue,
} from '@/lib/medicalHistoryQuestions';
import { useSaveMedicalHistory } from '@/hooks/useMedicalHistory';
import { Mic, ChevronRight, Check, Loader2 } from 'lucide-react';

interface MedicalHistoryOnboardingProps {
  userName: string;
  onComplete: () => void;
}

type Language = 'urdu' | 'english';
type InputMode = 'voice' | 'text';

export const MedicalHistoryOnboarding: React.FC<
  MedicalHistoryOnboardingProps
> = ({ userName, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [language, setLanguage] = useState<Language>('urdu');
  const [inputMode, setInputMode] = useState<InputMode>('voice'); // Voice input by default
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceError, setVoiceError] = useState('');
  const [transcript, setTranscript] = useState<
    Array<{ role: string; content: string; timestamp: string }>
  >([]);
  const [lastSpokenAnswer, setLastSpokenAnswer] = useState<string>('');

  const { saveMedicalHistory, isSaving } = useSaveMedicalHistory();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentQuestion = medicalHistoryQuestions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === medicalHistoryQuestions.length - 1;
  const progress =
    ((currentQuestionIndex + 1) / medicalHistoryQuestions.length) * 100;

  // Browser TTS fallback using Web Speech API
  const speakWithBrowserTTS = useCallback(
    (text: string) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        if (language === 'urdu') {
          const urduVoice = voices.find(
            v => v.lang.includes('ur') || v.lang.includes('hi')
          );
          if (urduVoice) utterance.voice = urduVoice;
        }
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    },
    [language]
  );

  // Text-to-Speech function using ElevenLabs with browser fallback
  const speak = useCallback(
    async (text: string, lang?: 'urdu' | 'english') => {
      if (!voiceEnabled) return;

      try {
        setIsSpeaking(true);
        const response = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language: lang || language,
          }),
        });

        if (!response.ok) {
          console.warn('TTS API unavailable, using browser TTS fallback');
          speakWithBrowserTTS(text);
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
          };
          await audioRef.current.play();
        }
      } catch (error) {
        console.warn('Speech error, using browser fallback:', error);
        speakWithBrowserTTS(text);
      }
    },
    [voiceEnabled, language, speakWithBrowserTTS]
  );

  // Handle audio end
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsSpeaking(false);
    }
  }, []);

  // Speak current question on load
  useEffect(() => {
    if (currentQuestion && voiceEnabled) {
      const questionText =
        language === 'urdu'
          ? currentQuestion.questionUrdu
          : currentQuestion.questionEnglish;
      speak(questionText, language);
    }
  }, [currentQuestionIndex, language, voiceEnabled, speak, currentQuestion]);

  // Speech-to-Text using Groq Whisper API
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language === 'urdu' ? 'ur' : 'en');

      const response = await fetch('/api/voice/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          'Could not transcribe your voice. Check the Groq API key or try text input.'
        );
      }

      const result = await response.json();
      if (result.text) {
        const spokenText = result.text;
        setCurrentAnswer(spokenText);
        setLastSpokenAnswer(spokenText);

        // Auto-advance for voice mode after showing the answer briefly
        if (inputMode === 'voice') {
          setTimeout(() => {
            // Auto-submit the answer
            handleVoiceSubmit(spokenText);
          }, 1500); // Wait 1.5s to show the answer before moving
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setVoiceError(
        error instanceof Error
          ? error.message
          : 'Could not transcribe your voice. Please try again.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle voice submit (auto-advance)
  const handleVoiceSubmit = async (spokenAnswer: string) => {
    if (!currentQuestion) return;

    // Prepare answer based on question type
    let answerValue: any = spokenAnswer;

    // For number type, try to parse
    if (currentQuestion.type === 'number') {
      const parsed = parseFloat(spokenAnswer.replace(/[^\d.]/g, ''));
      answerValue = isNaN(parsed) ? null : parsed;
    }

    // Skip _closing field
    if (currentQuestion.field !== '_closing') {
      // Update answers
      const newAnswers = { ...answers };
      setNestedValue(newAnswers, currentQuestion.field, answerValue);
      setAnswers(newAnswers);

      // Add to transcript
      const questionText =
        language === 'urdu'
          ? currentQuestion.questionUrdu
          : currentQuestion.questionEnglish;
      setTranscript(prev => [
        ...prev,
        {
          role: 'assistant',
          content: questionText,
          timestamp: new Date().toISOString(),
        },
        {
          role: 'user',
          content: String(answerValue),
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    // Check if last question
    if (isLastQuestion) {
      await handleComplete();
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setLastSpokenAnswer('');
      setSelectedOptions([]);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      setVoiceError('');
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Microphone could not start. Check browser permissions.';
      setVoiceError(message);
      setIsListening(false);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle option selection for select/multiselect
  const handleOptionSelect = (value: string) => {
    if (currentQuestion.type === 'multiselect') {
      if (value === 'none') {
        setSelectedOptions(['none']);
      } else {
        setSelectedOptions(prev => {
          const filtered = prev.filter(v => v !== 'none');
          return filtered.includes(value)
            ? filtered.filter(v => v !== value)
            : [...filtered, value];
        });
      }
    } else {
      setSelectedOptions([value]);
    }
  };

  // Handle boolean answer
  const handleBooleanAnswer = (value: boolean) => {
    setSelectedOptions([value ? 'yes' : 'no']);
  };

  // Submit current answer and move to next question
  const handleNext = async () => {
    if (!currentQuestion) return;

    // Prepare answer based on question type
    let answerValue: any;
    switch (currentQuestion.type) {
      case 'boolean':
        answerValue = selectedOptions[0] === 'yes';
        break;
      case 'select':
        answerValue = selectedOptions[0] || null;
        break;
      case 'multiselect':
        answerValue = selectedOptions.filter(v => v !== 'none');
        break;
      case 'number':
        answerValue = currentAnswer ? parseFloat(currentAnswer) : null;
        break;
      case 'text':
      default:
        answerValue = currentAnswer || null;
        break;
    }

    // Skip _closing field
    if (currentQuestion.field !== '_closing') {
      // Update answers
      const newAnswers = { ...answers };
      setNestedValue(newAnswers, currentQuestion.field, answerValue);
      setAnswers(newAnswers);

      // Add to transcript
      const questionText =
        language === 'urdu'
          ? currentQuestion.questionUrdu
          : currentQuestion.questionEnglish;
      setTranscript(prev => [
        ...prev,
        {
          role: 'assistant',
          content: questionText,
          timestamp: new Date().toISOString(),
        },
        {
          role: 'user',
          content: String(answerValue),
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    // Check if last question
    if (isLastQuestion) {
      await handleComplete();
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setSelectedOptions([]);
    }
  };

  // Complete onboarding
  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      // Prepare data for saving - ensure proper types
      const medicalHistoryData = {
        age: answers.age || null,
        gender: answers.gender || null,
        bloodGroup: answers.bloodGroup || null,
        weight: answers.weight || null,
        height: answers.height || null,
        familyHistory: answers.familyHistory || {},
        chronicConditions: Array.isArray(answers.chronicConditions)
          ? answers.chronicConditions
          : [],
        currentMedications: answers.currentMedications
          ? [answers.currentMedications].flat()
          : [],
        allergies: answers.allergies ? [answers.allergies].flat() : [],
        pastSurgeries: answers.pastSurgeries
          ? [answers.pastSurgeries].flat()
          : [],
        smokingStatus: answers.smokingStatus || null,
        alcoholConsumption: answers.alcoholConsumption || null,
        onboardingTranscript: transcript,
        isComplete: true,
      };

      console.log('Saving medical history:', medicalHistoryData);
      const result = await saveMedicalHistory(medicalHistoryData);
      console.log('Save result:', result);

      // Call onComplete callback to close modal and redirect
      onComplete();
    } catch (error) {
      console.error('Error saving medical history:', error);
      // Still call onComplete to not leave user stuck
      // The data might have partially saved
      onComplete();
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if current answer is valid
  const isAnswerValid = () => {
    if (!currentQuestion.required) return true;

    switch (currentQuestion.type) {
      case 'boolean':
      case 'select':
        return selectedOptions.length > 0;
      case 'multiselect':
        return selectedOptions.length > 0;
      case 'number':
        return currentAnswer !== '' && !isNaN(parseFloat(currentAnswer));
      case 'text':
        return (
          currentAnswer.trim() !== '' || currentQuestion.field === '_closing'
        );
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-[#2a5298] to-secondary overflow-hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />

      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl mx-4 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display text-white tracking-wide">
              {language === 'urdu' ? 'طبی تاریخ' : 'MEDICAL HISTORY'}
            </h2>
            <p className="text-white/60 text-sm mt-1">
              {language === 'urdu'
                ? `${userName}، آئیے آپ کی صحت کے بارے میں جانتے ہیں`
                : `${userName}, let's learn about your health`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={() =>
                setLanguage(language === 'urdu' ? 'english' : 'urdu')
              }
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors"
            >
              {language === 'urdu' ? 'English' : 'اردو'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Voice Orb */}
        <div className="flex flex-col items-center mb-8">
          <VoiceOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing || isTranscribing}
            size="md"
            onClick={toggleVoiceInput}
          />

          {/* Voice mode hint - show when not speaking, not listening, not processing */}
          {!isListening && !isSpeaking && !isTranscribing && (
            <p className="text-white/50 text-sm mt-4">
              {language === 'urdu' ? 'بولنے کے لیے ٹیپ کریں' : 'Tap to speak'}
            </p>
          )}

          {voiceError && (
            <p className="mt-4 max-w-md rounded-xl border border-red-300/40 bg-red-500/15 px-4 py-3 text-center text-sm text-red-100">
              {voiceError}
            </p>
          )}

          {/* AI Speaking indicator */}
          {isSpeaking && (
            <p className="text-blue-300 text-sm mt-4">
              {language === 'urdu' ? 'AI بول رہا ہے...' : 'AI is speaking...'}
            </p>
          )}

          {/* Listening indicator */}
          {isListening && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-400 text-sm mt-4 flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {language === 'urdu' ? 'سن رہا ہوں...' : 'Listening...'}
            </motion.p>
          )}

          {/* Transcribing indicator */}
          {isTranscribing && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-yellow-400 text-sm mt-4 flex items-center gap-2"
            >
              <Loader2 size={14} className="animate-spin" />
              {language === 'urdu' ? 'سمجھ رہا ہوں...' : 'Processing...'}
            </motion.p>
          )}

          {/* Show transcribed answer */}
          {lastSpokenAnswer &&
            inputMode === 'voice' &&
            !isListening &&
            !isTranscribing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 px-6 py-3 bg-white/10 rounded-xl border border-white/20"
              >
                <p className="text-white/60 text-xs mb-1">
                  {language === 'urdu' ? 'آپ کا جواب:' : 'Your answer:'}
                </p>
                <p
                  className={`text-white font-medium ${language === 'urdu' ? 'font-urdu text-right' : ''}`}
                >
                  {lastSpokenAnswer}
                </p>
              </motion.div>
            )}
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-8"
          >
            <p
              className={`text-xl text-white leading-relaxed ${language === 'urdu' ? 'font-urdu text-right' : ''}`}
            >
              {language === 'urdu'
                ? currentQuestion?.questionUrdu
                : currentQuestion?.questionEnglish}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Input Area */}
        <div className="mb-6">
          {/* Boolean Type */}
          {currentQuestion?.type === 'boolean' && (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleBooleanAnswer(true)}
                className={`px-8 py-3 rounded-xl font-medium transition-all ${
                  selectedOptions[0] === 'yes'
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {language === 'urdu' ? 'ہاں' : 'Yes'}
              </button>
              <button
                onClick={() => handleBooleanAnswer(false)}
                className={`px-8 py-3 rounded-xl font-medium transition-all ${
                  selectedOptions[0] === 'no'
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {language === 'urdu' ? 'نہیں' : 'No'}
              </button>
            </div>
          )}

          {/* Select Type */}
          {currentQuestion?.type === 'select' && currentQuestion.options && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {currentQuestion.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all text-sm ${
                    selectedOptions.includes(option.value)
                      ? 'bg-secondary text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {language === 'urdu' ? option.labelUrdu : option.labelEnglish}
                </button>
              ))}
            </div>
          )}

          {/* Multiselect Type */}
          {currentQuestion?.type === 'multiselect' &&
            currentQuestion.options && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentQuestion.options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2 ${
                      selectedOptions.includes(option.value)
                        ? 'bg-secondary text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {selectedOptions.includes(option.value) && (
                      <Check size={16} />
                    )}
                    {language === 'urdu'
                      ? option.labelUrdu
                      : option.labelEnglish}
                  </button>
                ))}
              </div>
            )}

          {/* Number/Text Type - Voice input only */}
          {(currentQuestion?.type === 'number' ||
            currentQuestion?.type === 'text') &&
            currentQuestion.field !== '_closing' && (
              <div className="flex flex-col items-center gap-4">
                {/* Voice input hint */}
                <p className="text-white/60 text-sm text-center">
                  {language === 'urdu'
                    ? 'جواب دینے کے لیے مائیک پر ٹیپ کریں'
                    : 'Tap the mic to answer'}
                </p>
              </div>
            )}

          {/* Closing Message - No input needed */}
          {currentQuestion?.field === '_closing' && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center"
              >
                <Check size={40} className="text-white" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Next Button - Show only for select/boolean questions */}
        {(currentQuestion?.type === 'boolean' ||
          currentQuestion?.type === 'select' ||
          currentQuestion?.type === 'multiselect' ||
          currentQuestion?.field === '_closing') && (
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              disabled={!isAnswerValid() || isSaving || isProcessing}
              className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                isAnswerValid() && !isSaving && !isProcessing
                  ? 'bg-white text-primary hover:bg-white/90'
                  : 'bg-white/20 text-white/40 cursor-not-allowed'
              }`}
            >
              {isSaving || isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {language === 'urdu' ? 'محفوظ ہو رہا ہے...' : 'Saving...'}
                </>
              ) : isLastQuestion ? (
                <>
                  {language === 'urdu' ? 'مکمل' : 'Complete'}
                  <Check size={20} />
                </>
              ) : (
                <>
                  {language === 'urdu' ? 'اگلا' : 'Next'}
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

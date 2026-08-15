'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VoiceOrbProps {
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  disabled?: boolean;
}

export function VoiceOrb({
  isSpeaking,
  isListening,
  isProcessing,
  onStartListening,
  onStopListening,
  disabled = false,
}: VoiceOrbProps) {
  const [pulseScale, setPulseScale] = useState(1);

  // Animate pulse when speaking
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setPulseScale(prev => (prev === 1 ? 1.15 : 1));
      }, 500);
      return () => clearInterval(interval);
    }
    return () => setPulseScale(1);
  }, [isSpeaking]);

  const handleClick = () => {
    if (disabled || isSpeaking || isProcessing) return;
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  // Determine orb state
  const getOrbState = () => {
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    if (isProcessing) return 'processing';
    return 'idle';
  };

  const state = getOrbState();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Orb */}
      <div className="relative">
        {/* Outer glow rings */}
        <AnimatePresence>
          {(state === 'speaking' || state === 'listening') && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute inset-0 rounded-full ${
                  state === 'speaking' ? 'bg-secondary/30' : 'bg-primary/30'
                }`}
                style={{ width: 160, height: 160, left: -20, top: -20 }}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                className={`absolute inset-0 rounded-full ${
                  state === 'speaking' ? 'bg-secondary/20' : 'bg-primary/20'
                }`}
                style={{ width: 180, height: 180, left: -30, top: -30 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          onClick={handleClick}
          disabled={disabled || isSpeaking || isProcessing}
          animate={{
            scale: state === 'speaking' ? pulseScale : 1,
          }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          className={`relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all shadow-2xl ${
            state === 'speaking'
              ? 'bg-gradient-to-br from-secondary to-purple-600 cursor-not-allowed'
              : state === 'listening'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : state === 'processing'
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500 cursor-not-allowed'
                  : 'bg-gradient-to-br from-primary to-secondary hover:shadow-primary/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Inner content */}
          {state === 'speaking' ? (
            // AI Speaking Animation (using SVG-like pattern)
            <div className="relative w-full h-full flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Volume2 className="w-12 h-12 text-white" />
              </motion.div>
              {/* Animated dots around */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  animate={{
                    scale: [0.5, 1, 0.5],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                  style={{
                    top: `${50 + 35 * Math.sin((i * Math.PI * 2) / 8)}%`,
                    left: `${50 + 35 * Math.cos((i * Math.PI * 2) / 8)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </div>
          ) : state === 'listening' ? (
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Mic className="w-12 h-12 text-white" />
              </motion.div>
              {/* Sound wave bars */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white rounded-full"
                    animate={{
                      height: [8, 20, 8],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : state === 'processing' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
            />
          ) : (
            <Mic className="w-12 h-12 text-white" />
          )}
        </motion.button>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p
          className={`text-sm font-medium ${
            state === 'speaking'
              ? 'text-secondary'
              : state === 'listening'
                ? 'text-red-500'
                : state === 'processing'
                  ? 'text-yellow-600'
                  : 'text-gray-600'
          }`}
        >
          {state === 'speaking' && 'AI is speaking...'}
          {state === 'listening' && 'Listening...'}
          {state === 'processing' && 'Processing...'}
          {state === 'idle' && 'Tap to speak'}
        </p>
        <p className="text-xs text-gray-400 mt-1 font-urdu">
          {state === 'speaking' && 'اے آئی بول رہا ہے'}
          {state === 'listening' && 'سن رہا ہوں'}
          {state === 'processing' && 'پروسیسنگ'}
          {state === 'idle' && 'بولنے کے لیے تھپتھپائیں'}
        </p>
      </div>
    </div>
  );
}

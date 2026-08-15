'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceOrbProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  isListening = false,
  isSpeaking = false,
  isProcessing = false,
  size = 'lg',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  const sizeMap = {
    sm: { container: 120, orb: 80 },
    md: { container: 180, orb: 120 },
    lg: { container: 280, orb: 180 },
  };

  const { container: containerSize, orb: orbSize } = sizeMap[size];

  // Particle class
  class Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    size: number;
    speed: number;
    angle: number;
    radius: number;
    opacity: number;
    color: string;

    constructor(centerX: number, centerY: number) {
      this.angle = Math.random() * Math.PI * 2;
      this.radius = orbSize / 2 + 10 + Math.random() * 40;
      this.x = centerX + Math.cos(this.angle) * this.radius;
      this.y = centerY + Math.sin(this.angle) * this.radius;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 3 + 1;
      this.speed = Math.random() * 0.02 + 0.01;
      this.opacity = Math.random() * 0.5 + 0.3;
      this.color = Math.random() > 0.5 ? '#3e6fcb' : '#1e3b70';
    }

    update(centerX: number, centerY: number, intensity: number) {
      this.angle += this.speed * (1 + intensity);
      const radiusOffset = Math.sin(this.angle * 3) * 10 * intensity;
      this.x = centerX + Math.cos(this.angle) * (this.radius + radiusOffset);
      this.y = centerY + Math.sin(this.angle) * (this.radius + radiusOffset);
      this.size = (Math.random() * 2 + 1) * (1 + intensity * 0.5);
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = containerSize / 2;
    const centerY = containerSize / 2;

    // Initialize particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 60; i++) {
        particlesRef.current.push(new Particle(centerX, centerY));
      }
    }

    let intensity = 0;
    const targetIntensity = isListening
      ? 1
      : isSpeaking
        ? 0.7
        : isProcessing
          ? 0.4
          : 0.1;

    const animate = () => {
      ctx.clearRect(0, 0, containerSize, containerSize);

      // Smooth intensity transition
      intensity += (targetIntensity - intensity) * 0.05;

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update(centerX, centerY, intensity);
        particle.draw(ctx);
      });

      // Draw connecting lines between close particles
      ctx.strokeStyle = 'rgba(62, 111, 203, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const dx = particlesRef.current[i].x - particlesRef.current[j].x;
          const dy = particlesRef.current[i].y - particlesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 50) {
            ctx.beginPath();
            ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.globalAlpha = (1 - distance / 50) * 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking, isProcessing, containerSize, orbSize]);

  return (
    <div
      className={`relative flex items-center justify-center ${isSpeaking ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ width: containerSize, height: containerSize }}
      onClick={isSpeaking ? undefined : onClick}
    >
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        width={containerSize}
        height={containerSize}
        className="absolute inset-0"
      />

      {/* Glow Effect */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.2, 1] : isSpeaking ? [1, 1.1, 1] : 1,
          opacity: isListening ? 0.6 : isSpeaking ? 0.4 : 0.2,
        }}
        transition={{
          duration: isListening ? 0.8 : 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl"
        style={{ width: orbSize + 40, height: orbSize + 40 }}
      />

      {/* Main Orb */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.05, 1] : isSpeaking ? [1, 1.03, 1] : 1,
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 rounded-full bg-gradient-to-br from-primary via-[#2a5298] to-secondary shadow-2xl flex items-center justify-center"
        style={{ width: orbSize, height: orbSize }}
      >
        {/* Inner Glow */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

        {/* Status Icon */}
        <AnimatePresence mode="wait">
          {isListening && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* Sound Waves */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scaleY: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="w-1 bg-white rounded-full"
                    style={{ height: 24 + i * 4 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {isSpeaking && (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* AI Speaking Animation - Custom Brain SVG */}
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <svg className="w-22 h-22" viewBox="0 0 32 32" fill="none">
                  <defs>
                    <filter
                      id="aiShadow"
                      width="215.5%"
                      height="217.2%"
                      x="-7.5%"
                      y="-6%"
                      filterUnits="objectBoundingBox"
                    >
                      <feOffset
                        dy=".5"
                        in="SourceAlpha"
                        result="shadowOffsetOuter1"
                      />
                      <feGaussianBlur
                        in="shadowOffsetOuter1"
                        result="shadowBlurOuter1"
                        stdDeviation=".5"
                      />
                      <feColorMatrix
                        in="shadowBlurOuter1"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.204257246 0"
                      />
                    </filter>
                  </defs>
                  <path
                    fill="#000"
                    filter="url(#aiShadow)"
                    d="M15.725 6.06c.479-.247 1.064.324.81.795c-.149.384-.71.486-.996.193c-.303-.28-.204-.836.186-.989zm-5.155.546c.291-.118.66.144.63.457c.03.338-.39.588-.687.427c-.393-.15-.348-.778.057-.884m10.558.893c-.455-.054-.527-.758-.09-.9c.34-.162.652.143.702.46c-.072.27-.302.518-.612.44m-9.385 1.265c.487-.303 1.181.148 1.106.705c-.025.561-.783.887-1.211.507c-.414-.298-.351-.982.105-1.212m7.43.322c.217-.55 1.097-.568 1.344-.032c.245.417-.056.934-.491 1.076c-.577.106-1.124-.508-.853-1.044m-4.069 1.013c-.005-.474.433-.826.89-.859c.304.06.634.187.764.488c.243.416.027.987-.41 1.178c-.2.11-.438.069-.656.056c-.333-.16-.614-.477-.588-.863m-7.666.69c.445-.27 1.045.22.876.696c-.092.411-.654.578-.975.316c-.343-.246-.289-.837.1-1.013zm16.462-.002c.377-.288 1 .043.954.511c.026.427-.513.75-.887.53c-.412-.183-.455-.807-.067-1.04zm-6.64.851c.622-.22 1.362.043 1.716.59c.468.667.22 1.683-.507 2.066c-.752.453-1.851.07-2.13-.758c-.315-.74.145-1.666.92-1.898zm-3.653.073c.69-.32 1.619-.052 1.952.642c.392.676.089 1.617-.612 1.966c-.702.393-1.693.095-2.032-.63c-.381-.702-.043-1.655.692-1.978M9.95 12.94c.053-.437.472-.722.895-.752a.98.98 0 0 1 .87.857c-.03.45-.383.888-.867.886c-.533.045-1-.477-.898-.991m10.802-.656c.547-.313 1.306.142 1.282.76c.037.655-.803 1.116-1.347.732c-.566-.32-.522-1.22.065-1.492m-8.63 2.307c.638-.173 1.37.123 1.683.701c.343.582.203 1.39-.33 1.818c-.685.626-1.946.374-2.31-.48c-.419-.783.09-1.833.956-2.04zm6.927-.003c.621-.175 1.351.06 1.685.617c.442.637.231 1.588-.426 1.998c-.69.477-1.756.227-2.136-.519c-.46-.771.003-1.861.877-2.096m-11.04.726c.552-.205 1.164.394.94.933c-.136.49-.839.672-1.202.31c-.425-.34-.268-1.095.262-1.243m14.969.782a.836.836 0 0 1 .788-.874c.378.06.746.36.716.765c.035.535-.62.898-1.084.647c-.217-.109-.328-.328-.42-.538M5.294 15.58c.332-.143.743.14.667.503c-.018.411-.635.57-.861.226c-.2-.239-.08-.606.194-.73zm20.949-.009c.234-.163.61-.046.702.223c.157.294-.131.696-.467.647c-.472.042-.624-.665-.235-.87m-12.317 1.973c.874-.223 1.814.494 1.82 1.38c.056.895-.87 1.688-1.764 1.482c-.692-.11-1.235-.766-1.212-1.453c-.002-.658.502-1.27 1.156-1.409m3.462-.001c.887-.244 1.855.486 1.841 1.392c.047.878-.85 1.645-1.726 1.47c-.825-.104-1.433-.995-1.203-1.783c.116-.524.562-.95 1.088-1.08zm-6.676.545c.614-.103 1.19.57.941 1.144c-.182.612-1.086.777-1.486.278c-.468-.48-.118-1.356.545-1.422m10.154.027c.548-.226 1.22.24 1.178.825c.022.643-.808 1.087-1.343.711c-.607-.337-.496-1.33.165-1.536m2.838 2.8c-.214-.393.175-.914.62-.841c.22-.004.375.167.516.311c.029.233.078.511-.119.69c-.267.333-.872.238-1.017-.16m-16.268-.732c.415-.271 1.012.134.918.61c-.05.423-.59.664-.945.424c-.382-.217-.368-.836.027-1.034m8.193.883c.543-.235 1.235.23 1.183.818c.04.65-.815 1.1-1.346.71c-.59-.335-.491-1.321.163-1.528m-3.794.871c.462-.239 1.082.174 1.04.684c.014.418-.4.774-.82.712c-.347-.007-.573-.314-.685-.605c.006-.317.139-.67.465-.79zm7.686.008c.476-.29 1.152.126 1.107.67c.012.57-.752.934-1.195.56c-.428-.293-.376-.997.088-1.23m1.337 3.25c-.212-.314.037-.693.38-.765c.277.055.57.26.511.574c-.04.427-.674.557-.891.192zm-10.611-.273c.084-.25.288-.497.587-.432c.435.03.564.676.183.875c-.342.227-.74-.084-.77-.443m5.12.287c.083-.37.568-.549.888-.353c.212.09.274.322.328.52a9 9 0 0 0-.08.31c-.131.152-.3.305-.518.3c-.405.047-.771-.404-.619-.777z"
                  />
                  <path
                    fill="#ffffff"
                    d="M15.725 6.06c.479-.247 1.064.324.81.795c-.149.384-.71.486-.996.193c-.303-.28-.204-.836.186-.989zm-5.155.546c.291-.118.66.144.63.457c.03.338-.39.588-.687.427c-.393-.15-.348-.778.057-.884m10.558.893c-.455-.054-.527-.758-.09-.9c.34-.162.652.143.702.46c-.072.27-.302.518-.612.44m-9.385 1.265c.487-.303 1.181.148 1.106.705c-.025.561-.783.887-1.211.507c-.414-.298-.351-.982.105-1.212m7.43.322c.217-.55 1.097-.568 1.344-.032c.245.417-.056.934-.491 1.076c-.577.106-1.124-.508-.853-1.044m-4.069 1.013c-.005-.474.433-.826.89-.859c.304.06.634.187.764.488c.243.416.027.987-.41 1.178c-.2.11-.438.069-.656.056c-.333-.16-.614-.477-.588-.863m-7.666.69c.445-.27 1.045.22.876.696c-.092.411-.654.578-.975.316c-.343-.246-.289-.837.1-1.013zm16.462-.002c.377-.288 1 .043.954.511c.026.427-.513.75-.887.53c-.412-.183-.455-.807-.067-1.04zm-6.64.851c.622-.22 1.362.043 1.716.59c.468.667.22 1.683-.507 2.066c-.752.453-1.851.07-2.13-.758c-.315-.74.145-1.666.92-1.898zm-3.653.073c.69-.32 1.619-.052 1.952.642c.392.676.089 1.617-.612 1.966c-.702.393-1.693.095-2.032-.63c-.381-.702-.043-1.655.692-1.978M9.95 12.94c.053-.437.472-.722.895-.752a.98.98 0 0 1 .87.857c-.03.45-.383.888-.867.886c-.533.045-1-.477-.898-.991m10.802-.656c.547-.313 1.306.142 1.282.76c.037.655-.803 1.116-1.347.732c-.566-.32-.522-1.22.065-1.492m-8.63 2.307c.638-.173 1.37.123 1.683.701c.343.582.203 1.39-.33 1.818c-.685.626-1.946.374-2.31-.48c-.419-.783.09-1.833.956-2.04zm6.927-.003c.621-.175 1.351.06 1.685.617c.442.637.231 1.588-.426 1.998c-.69.477-1.756.227-2.136-.519c-.46-.771.003-1.861.877-2.096m-11.04.726c.552-.205 1.164.394.94.933c-.136.49-.839.672-1.202.31c-.425-.34-.268-1.095.262-1.243m14.969.782a.836.836 0 0 1 .788-.874c.378.06.746.36.716.765c.035.535-.62.898-1.084.647c-.217-.109-.328-.328-.42-.538M5.294 15.58c.332-.143.743.14.667.503c-.018.411-.635.57-.861.226c-.2-.239-.08-.606.194-.73zm20.949-.009c.234-.163.61-.046.702.223c.157.294-.131.696-.467.647c-.472.042-.624-.665-.235-.87m-12.317 1.973c.874-.223 1.814.494 1.82 1.38c.056.895-.87 1.688-1.764 1.482c-.692-.11-1.235-.766-1.212-1.453c-.002-.658.502-1.27 1.156-1.409m3.462-.001c.887-.244 1.855.486 1.841 1.392c.047.878-.85 1.645-1.726 1.47c-.825-.104-1.433-.995-1.203-1.783c.116-.524.562-.95 1.088-1.08zm-6.676.545c.614-.103 1.19.57.941 1.144c-.182.612-1.086.777-1.486.278c-.468-.48-.118-1.356.545-1.422m10.154.027c.548-.226 1.22.24 1.178.825c.022.643-.808 1.087-1.343.711c-.607-.337-.496-1.33.165-1.536m2.838 2.8c-.214-.393.175-.914.62-.841c.22-.004.375.167.516.311c.029.233.078.511-.119.69c-.267.333-.872.238-1.017-.16m-16.268-.732c.415-.271 1.012.134.918.61c-.05.423-.59.664-.945.424c-.382-.217-.368-.836.027-1.034m8.193.883c.543-.235 1.235.23 1.183.818c.04.65-.815 1.1-1.346.71c-.59-.335-.491-1.321.163-1.528m-3.794.871c.462-.239 1.082.174 1.04.684c.014.418-.4.774-.82.712c-.347-.007-.573-.314-.685-.605c.006-.317.139-.67.465-.79zm7.686.008c.476-.29 1.152.126 1.107.67c.012.57-.752.934-1.195.56c-.428-.293-.376-.997.088-1.23m1.337 3.25c-.212-.314.037-.693.38-.765c.277.055.57.26.511.574c-.04.427-.674.557-.891.192zm-10.611-.273c.084-.25.288-.497.587-.432c.435.03.564.676.183.875c-.342.227-.74-.084-.77-.443m5.12.287c.083-.37.568-.549.888-.353c.212.09.274.322.328.52a9 9 0 0 0-.08.31c-.131.152-.3.305-.518.3c-.405.047-.771-.404-.619-.777z"
                  />
                </svg>
              </motion.div>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{
                rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
              }}
            >
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </motion.div>
          )}

          {!isListening && !isSpeaking && !isProcessing && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Rotating Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute rounded-full border-2 border-dashed border-primary/20"
        style={{ width: orbSize + 60, height: orbSize + 60 }}
      />
    </div>
  );
};

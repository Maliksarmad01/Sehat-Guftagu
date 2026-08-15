"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface StreamingThinkingProps {
    isVisible: boolean;
}

export function StreamingThinking({ isVisible }: StreamingThinkingProps) {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start"
        >
            <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-white shadow-md border border-gray-100">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-700 font-medium">AI is thinking...</span>
                        <span className="text-xs text-gray-500 font-urdu">سوچ رہا ہوں...</span>
                    </div>
                </div>

                {/* Animated dots */}
                <div className="flex items-center gap-1 mt-3">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-primary/40 rounded-full"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

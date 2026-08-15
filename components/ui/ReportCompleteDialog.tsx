'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, FileText, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReportCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export function ReportCompleteDialog({
  isOpen,
  onClose,
  sessionId,
}: ReportCompleteDialogProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push('/patient/dashboard');
  };

  const handleViewReports = () => {
    router.push('/patient/reports');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Report Generated!
          </h2>

          {/* Message */}
          <p className="text-center text-gray-600 mb-4">
            Thank you for your time. Your medical report has been created and is
            now pending review by our clinical team.
          </p>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 font-medium text-sm">
                Status: Pending Review
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Session ID */}
          {sessionId && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Session ID: {sessionId.slice(0, 8)}...
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

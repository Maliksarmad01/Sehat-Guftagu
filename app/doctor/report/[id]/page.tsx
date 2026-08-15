'use client';

import { useEffect, useState, use, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Download,
  MessageSquare,
  Send,
  Pill,
  Printer,
  Volume2,
  Loader2,
  Star,
  RefreshCw,
  Building,
  Share2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface ReportData {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  patientInfo: {
    age?: number;
    gender?: string;
    bloodGroup?: string;
  } | null;
  medicalHistory: {
    chronicConditions?: string[];
    currentMedications?: string[];
    allergies?: string[];
  } | null;
  subjective: {
    chiefComplaint: string;
    symptoms: string[];
    patientHistory: string;
    patientNarrative: string;
  };
  objective: {
    reportedSymptoms: string[];
    severity: string;
    confidenceLevel: number;
  };
  assessment: {
    primaryDiagnosis: string;
    differentialDiagnosis: string[];
    severity: string;
    confidence: number;
    aiAnalysis: string;
    redFlags: string[];
  };
  plan: {
    recommendations: string[];
    testsNeeded: string[];
    specialistReferral?: string;
    followUpNeeded: boolean;
    urgency: string;
  };
  department: string;
  priority: string;
  reviewStatus: string;
  createdAt: string;
  sessionDate: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function DoctorReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [includeDoctorDetails, setIncludeDoctorDetails] = useState(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };
    getSession();
  }, [router]);

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${id}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data.report);
        }
      } catch (error) {
        console.error('Failed to fetch report:', error);
      }
    };

    if (user) {
      fetchReport();
    }
  }, [id, user]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleRatingClick = (star: number) => {
    setRating(star);
  };

  const handleRegenerate = async () => {
    if (!notes.trim()) {
      alert('Please provide feedback notes for regeneration');
      return;
    }
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/reports/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: notes,
          starRating: rating || 2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setReport(prev =>
            prev
              ? {
                  ...prev,
                  subjective: data.report.subjective,
                  objective: data.report.objective,
                  assessment: data.report.assessment,
                  plan: data.report.plan,
                }
              : null
          );
        }
        // Refresh the page data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnBase64: false }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SOAP_Report_${id.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch(`/api/reports/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: chatInput,
          chatHistory: chatMessages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!decision || !rating) return;

    setIsSubmitting(true);
    try {
      // If prescription is provided and approved, generate prescription PDF
      if (decision === 'accept' && prescription.trim()) {
        await fetch(`/api/reports/${id}/prescription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prescription,
            includeDoctorDetails,
            returnBase64: true,
          }),
        });
      }

      // Submit the review
      const res = await fetch(`/api/reports/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: decision === 'accept' ? 'approve' : 'reject',
          feedback: notes,
          starRating: rating,
          rejectionReason: decision === 'reject' ? notes : undefined,
          prescription: decision === 'accept' ? prescription : undefined,
          doctorNotes: notes,
        }),
      });

      if (res.ok) {
        router.push('/doctor/dashboard');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      emergency: { bg: 'bg-red-100 border-red-200', text: 'text-red-700' },
      urgent: {
        bg: 'bg-orange-100 border-orange-200',
        text: 'text-orange-700',
      },
      high: { bg: 'bg-orange-100 border-orange-200', text: 'text-orange-700' },
      standard: { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700' },
      normal: { bg: 'bg-green-100 border-green-200', text: 'text-green-700' },
      routine: { bg: 'bg-green-100 border-green-200', text: 'text-green-700' },
    };
    const { bg, text } = config[urgency?.toLowerCase()] || config.standard;
    return { bg, text };
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const urgencyStyle = getUrgencyBadge(report.priority);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/doctor/dashboard">
              <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <Image
                src="/logo/sehat-guftagu-logo.svg"
                alt="AI"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <div>
                <h1 className="font-semibold text-gray-800">
                  SOAP Report Review
                </h1>
                <p className="text-xs text-gray-500">
                  Report #{id.slice(0, 12)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SOAP Report */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {report.patientName}
                    </h2>
                    <p className="text-gray-500">
                      {report.patientInfo?.age
                        ? `${report.patientInfo.age} years old`
                        : 'Age not specified'}
                      {report.patientInfo?.gender
                        ? ` • ${report.patientInfo.gender}`
                        : ''}
                      {report.patientInfo?.bloodGroup
                        ? ` • ${report.patientInfo.bloodGroup}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <div
                    className={`px-4 py-2 rounded-xl border ${urgencyStyle.bg} ${urgencyStyle.text} flex items-center gap-2`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium capitalize">
                      {report.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                    <Building className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">
                      {report.department || 'General'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(report.sessionDate).toLocaleString()}
                </span>
                <span>•</span>
                <span>
                  Confidence:{' '}
                  {report.assessment?.confidence ||
                    report.objective?.confidenceLevel}
                  %
                </span>
              </div>
            </motion.div>

            {/* Subjective */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">S</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Subjective</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Chief Complaint
                  </p>
                  <p className="text-gray-800">
                    {report.subjective?.chiefComplaint || 'Not specified'}
                  </p>
                </div>
                {report.subjective?.patientNarrative && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Patient Narrative
                    </p>
                    <p className="text-gray-800">
                      {report.subjective.patientNarrative}
                    </p>
                  </div>
                )}
                {report.subjective?.symptoms?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Reported Symptoms
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {report.subjective.symptoms.map((symptom, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {report.medicalHistory && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    {report.medicalHistory.chronicConditions &&
                      report.medicalHistory.chronicConditions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            Chronic Conditions
                          </p>
                          <p className="text-gray-800 text-sm">
                            {report.medicalHistory.chronicConditions.join(', ')}
                          </p>
                        </div>
                      )}
                    {report.medicalHistory.currentMedications &&
                      report.medicalHistory.currentMedications.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            Current Medications
                          </p>
                          <p className="text-gray-800 text-sm">
                            {report.medicalHistory.currentMedications.join(
                              ', '
                            )}
                          </p>
                        </div>
                      )}
                    {report.medicalHistory.allergies &&
                      report.medicalHistory.allergies.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            Allergies
                          </p>
                          <p className="text-red-600 text-sm">
                            {report.medicalHistory.allergies.join(', ')}
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Objective */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600">O</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Objective</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Vital signs not collected during virtual consultation.
                      Patient should have vitals measured during in-person
                      visit.
                    </span>
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      Severity
                    </p>
                    <p className="font-semibold text-gray-800 capitalize">
                      {report.objective?.severity || 'Moderate'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      Confidence
                    </p>
                    <p className="font-semibold text-gray-800">
                      {report.objective?.confidenceLevel || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      Symptoms
                    </p>
                    <p className="font-semibold text-gray-800">
                      {report.objective?.reportedSymptoms?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-yellow-600">A</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Assessment</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Primary Diagnosis
                  </p>
                  <p className="text-xl font-semibold text-gray-800">
                    {report.assessment?.primaryDiagnosis || 'Under evaluation'}
                  </p>
                </div>
                {report.assessment?.differentialDiagnosis &&
                  report.assessment.differentialDiagnosis.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Differential Diagnoses
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.assessment.differentialDiagnosis.map(
                          (dx, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-gray-100 rounded-lg text-gray-700 text-sm"
                            >
                              {dx}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                {report.assessment?.aiAnalysis && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Clinical Reasoning
                    </p>
                    <p className="text-gray-700 text-sm">
                      {report.assessment.aiAnalysis}
                    </p>
                  </div>
                )}
                {report.assessment?.redFlags &&
                  report.assessment.redFlags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        ⚠️ Red Flags Identified
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.assessment.redFlags.map((flag, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>

            {/* Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-purple-600">P</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Plan (AI Recommended)
                </h3>
              </div>
              <div className="space-y-4">
                {report.plan?.recommendations &&
                  report.plan.recommendations.length > 0 && (
                    <ul className="space-y-2">
                      {report.plan.recommendations.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl"
                        >
                          <span className="w-6 h-6 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-gray-800">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                {report.plan?.testsNeeded &&
                  report.plan.testsNeeded.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Recommended Tests
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.plan.testsNeeded.map((test, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                          >
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {report.plan?.specialistReferral && (
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                    <Building className="w-5 h-5 text-indigo-600" />
                    <span className="text-indigo-700">
                      Specialist Referral: {report.plan.specialistReferral}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Review Decision
              </h3>

              {/* Accept/Reject Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setDecision('accept')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    decision === 'accept'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <CheckCircle
                    className={`w-8 h-8 mx-auto mb-2 ${
                      decision === 'accept' ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                  <p
                    className={`font-medium ${
                      decision === 'accept' ? 'text-green-700' : 'text-gray-600'
                    }`}
                  >
                    Accept
                  </p>
                </button>
                <button
                  onClick={() => setDecision('reject')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    decision === 'reject'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <XCircle
                    className={`w-8 h-8 mx-auto mb-2 ${
                      decision === 'reject' ? 'text-red-600' : 'text-gray-400'
                    }`}
                  />
                  <p
                    className={`font-medium ${
                      decision === 'reject' ? 'text-red-700' : 'text-gray-600'
                    }`}
                  >
                    Reject
                  </p>
                </button>
              </div>

              {/* Rating System */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Rate this AI Report
                </h4>
                <div className="flex items-center justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-600">
                    You rated: {rating}/5 stars
                  </p>
                )}

                {/* Regenerate Button - Show if rating < 3 */}
                {rating > 0 && rating < 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <Button
                      onClick={handleRegenerate}
                      disabled={isRegenerating || !notes.trim()}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3"
                    >
                      {isRegenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate Report
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Add feedback notes below, then click to regenerate.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor's Notes / Feedback
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add your notes, corrections, or feedback for AI improvement..."
                  className="w-full h-24 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Prescription Button */}
              <button
                onClick={() => setShowPrescription(!showPrescription)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-primary" />
                  <span className="font-medium text-gray-700">
                    Write Prescription
                  </span>
                </span>
                <span className="text-gray-400">
                  {showPrescription ? '−' : '+'}
                </span>
              </button>

              <AnimatePresence>
                {showPrescription && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <textarea
                      value={prescription}
                      onChange={e => setPrescription(e.target.value)}
                      placeholder="Enter prescription details...&#10;e.g., Panadol 500mg - 1 tablet 3 times daily after meals for 5 days"
                      className="w-full h-32 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
                    />
                    <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDoctorDetails}
                        onChange={e =>
                          setIncludeDoctorDetails(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <span className="text-sm font-medium text-blue-700 flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          Include my details in prescription
                        </span>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Your name, specialization, license, and contact info
                          will be visible to patient
                        </p>
                      </div>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat with AI */}
              <button
                onClick={() => setShowChat(true)}
                className="w-full flex items-center justify-between p-4 bg-primary/5 rounded-xl mb-6 hover:bg-primary/10 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">
                    Chat with Report
                  </span>
                </span>
                <span className="text-primary/60 text-sm">Ask questions</span>
              </button>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitReview}
                disabled={!decision || !rating || isSubmitting}
                className="w-full py-6 bg-gradient-to-r from-primary to-secondary rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
              {!rating && decision && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Please rate the report before submitting
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Chat with Report
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 bg-gray-50 rounded-xl p-4 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Ask questions about this report</p>
                    <p className="text-sm mt-1">
                      E.g., "Why was this diagnosis suggested?"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl p-3 ${
                            msg.role === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-xl p-3">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={handleSendChat}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="rounded-xl bg-primary"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MessageSquare,
  FileText,
  LogOut,
  Activity,
  Clock,
  Stethoscope,
  User,
  Search,
  ChevronDown,
  Download,
  Building2,
  Loader2,
  Lock,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface DashboardStats {
  totalSessions: number;
  reportsReady: number;
  pendingReview: number;
}

interface Session {
  id: string;
  chiefComplaint: string;
  department: string;
  status: string;
  createdAt: string;
  reportId: string | null;
  hasPrescription: boolean;
}

interface Prescription {
  id: string;
  reportId: string;
  chiefComplaint: string;
  department: string;
  prescription: string;
  doctorNotes: string | null;
  doctorName: string;
  doctorSpecialization: string | null;
  doctorHospital: string | null;
  reviewedAt: string;
  createdAt: string;
}

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'interview' | 'prescriptions'>(
    'interview'
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic data states
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    reportsReady: 0,
    pendingReview: 0,
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedPrescription, setExpandedPrescription] = useState<
    string | null
  >(null);
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);

  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        router.push('/login');
        setLoading(false);
        return;
      }

      setUser(data.user);

      // Check if medical history is complete
      try {
        const res = await fetch('/api/medical-history');
        if (res.ok) {
          const payload = await res.json();
          if (!payload?.isComplete) {
            router.push('/patient/medical_session');
            return;
          }
        } else {
          router.push('/patient/medical_session');
          return;
        }
      } catch (e) {
        console.error('Failed to load medical history', e);
      }

      setLoading(false);
    };
    getSession();
  }, [router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setDataLoading(true);
      try {
        const res = await fetch('/api/patient/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setSessions(data.sessions);
          setPrescriptions(data.prescriptions);
        }
      } catch (e) {
        console.error('Failed to fetch dashboard data', e);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
      // Refresh every 30 seconds for live updates
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'reviewed':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'in_review':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredSessions = sessions.filter(
    s =>
      s.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/patient/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo/sehat-guftagu-logo.svg"
                alt="Sehat Guftagu"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="font-display text-lg tracking-wide text-gray-800 hidden sm:block">
                SEHAT GUFTAGU
              </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || 'P'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.name || 'Patient'}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <Link href="/patient/profile">
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800">
            Hello,{' '}
            <span className="text-primary">
              {user?.name?.split(' ')[0] || 'Patient'}
            </span>
          </h1>
          <p className="font-urdu text-secondary mt-1">
            آپ کی صحت، ہماری ترجیح
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex bg-gray-100 rounded-2xl p-1 max-w-md">
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'interview'
                  ? 'bg-white text-primary shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Clinical Interview
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'prescriptions'
                  ? 'bg-white text-primary shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Doctor Prescriptions
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'interview' ? (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Start New Interview */}
              <div className="lg:col-span-2 bg-gradient-to-br from-primary via-[#2a5298] to-secondary rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                  <Stethoscope size={200} strokeWidth={0.5} />
                </div>
                <div className="relative z-10">
                  <h2 className="font-display text-3xl mb-4">
                    START HEALTH INTERVIEW
                  </h2>
                  <p className="text-blue-100 mb-6 max-w-md">
                    Tell us about your symptoms. Our AI will ask follow-up
                    questions to understand your condition better.
                  </p>
                  <p className="font-urdu text-blue-200 mb-8 text-right">
                    اپنی علامات بتائیں - ہمارا اے آئی آپ کی مدد کرے گا
                  </p>
                  <Button
                    onClick={() => setShowInterviewDialog(true)}
                    className="bg-white text-primary hover:bg-gray-100 rounded-xl px-8 py-6 text-lg font-semibold"
                  >
                    <Stethoscope className="w-5 h-5 mr-2" />
                    Begin Interview
                  </Button>
                </div>
              </div>

              {/* Quick Stats - Dynamic */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      {dataLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">
                          {stats.totalSessions}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Total Sessions</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      {dataLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">
                          {stats.reportsReady}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Reports Ready</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      {dataLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-800">
                          {stats.pendingReview}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Pending Review</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sessions - Dynamic */}
              <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-md">
                <h3 className="font-heading text-lg font-bold text-gray-800 mb-4">
                  Recent Sessions
                </h3>
                {dataLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No sessions yet. Start your first health interview!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSessions.map(session => {
                      const isReviewed = session.status === 'approved';
                      return (
                        <div
                          key={session.id}
                          className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-colors ${
                            isReviewed
                              ? 'hover:bg-gray-100 cursor-pointer'
                              : 'opacity-80'
                          }`}
                          onClick={() => {
                            if (isReviewed) {
                              setActiveTab('prescriptions');
                            }
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isReviewed ? 'bg-green-100' : 'bg-primary/10'
                              }`}
                            >
                              {isReviewed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Activity className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {session.chiefComplaint || 'Clinical Interview'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(session.createdAt)} •{' '}
                                {session.department}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isReviewed && (
                              <Lock className="w-4 h-4 text-gray-400" />
                            )}
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(session.status)}`}
                            >
                              {session.status === 'approved'
                                ? 'Reviewed'
                                : session.status === 'pending'
                                  ? 'Awaiting Review'
                                  : session.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="prescriptions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Pending Sessions */}
              {sessions.filter(s => s.status !== 'approved').length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                  <h3 className="font-heading text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    Awaiting Doctor Review
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    These sessions are being reviewed by doctors. You'll be
                    notified when prescriptions are ready.
                  </p>
                  <div className="space-y-3">
                    {sessions
                      .filter(s => s.status !== 'approved')
                      .map(session => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {session.chiefComplaint || 'Clinical Interview'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(session.createdAt)} •{' '}
                                {session.department}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-gray-400" />
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-700">
                              Awaiting Review
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Doctor Prescriptions - Dynamic */}
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="font-heading text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Doctor Prescriptions & Recommendations
                </h3>
                <p className="font-urdu text-secondary mb-6">
                  ڈاکٹر کی تجاویز اور نسخے
                </p>

                {dataLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : prescriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>
                      No prescriptions yet. Complete a health interview and wait
                      for doctor review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((prescription, i) => {
                      const isExpanded =
                        expandedPrescription === prescription.id;
                      return (
                        <div
                          key={prescription.id}
                          className="border border-green-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
                        >
                          {/* Clickable Header */}
                          <div
                            className="flex items-center justify-between p-4 bg-green-50 cursor-pointer"
                            onClick={() =>
                              setExpandedPrescription(
                                isExpanded ? null : prescription.id
                              )
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {prescription.chiefComplaint ||
                                    'Clinical Interview'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(prescription.reviewedAt)} • Dr.{' '}
                                  {prescription.doctorName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {i === 0 && (
                                <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-lg">
                                  New
                                </span>
                              )}
                              <ChevronDown
                                className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </div>

                          {/* Expandable Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 border-t border-green-100">
                                  {/* Doctor Info */}
                                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white">
                                      <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800">
                                        Dr. {prescription.doctorName}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {prescription.doctorSpecialization ||
                                          prescription.department}
                                      </p>
                                      {prescription.doctorHospital && (
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                          <Building2 className="w-3 h-3" />
                                          {prescription.doctorHospital}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Prescription */}
                                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                                      Prescription
                                    </p>
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                      {prescription.prescription}
                                    </p>
                                  </div>

                                  {/* Doctor Notes */}
                                  {prescription.doctorNotes && (
                                    <div className="bg-blue-50 rounded-xl p-4 mb-4">
                                      <p className="text-xs text-blue-600 uppercase tracking-wide mb-2">
                                        Doctor's Notes
                                      </p>
                                      <p className="text-gray-700 whitespace-pre-wrap">
                                        {prescription.doctorNotes}
                                      </p>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-lg"
                                      onClick={async e => {
                                        e.stopPropagation();
                                        try {
                                          const res = await fetch(
                                            `/api/reports/${prescription.reportId}/prescription`
                                          );
                                          if (res.ok) {
                                            const blob = await res.blob();
                                            const url =
                                              window.URL.createObjectURL(blob);
                                            const a =
                                              document.createElement('a');
                                            a.href = url;
                                            a.download = `Prescription_${prescription.reportId.slice(0, 8)}.pdf`;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
                                          } else {
                                            alert(
                                              'Failed to download prescription'
                                            );
                                          }
                                        } catch (err) {
                                          console.error('Download error:', err);
                                          alert(
                                            'Failed to download prescription'
                                          );
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download PDF
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Interview Mode Selection Dialog */}
      <AnimatePresence>
        {showInterviewDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInterviewDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Choose Interview Mode
                </h2>
                <p className="font-urdu text-secondary mb-4">
                  انٹرویو کا طریقہ منتخب کریں
                </p>
                <p className="text-gray-600 text-sm">
                  Select how you&apos;d like to communicate with our AI health
                  assistant. Both options support English and Urdu.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Voice Option */}
                <Link href="/patient/interview?mode=voice">
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary group">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Mic className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Voice Interview
                    </h3>
                    <p className="font-urdu text-secondary text-sm mb-2">
                      آواز سے بات کریں
                    </p>
                    <p className="text-xs text-gray-500">
                      Speak naturally and let our AI understand your symptoms
                      through conversation.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Real-time voice</span>
                    </div>
                  </div>
                </Link>

                {/* Text Option */}
                <Link href="/patient/interview?mode=text">
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary group">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Text Chat
                    </h3>
                    <p className="font-urdu text-secondary text-sm mb-2">
                      ٹائپ کر کے بتائیں
                    </p>
                    <p className="text-xs text-gray-500">
                      Type your symptoms and receive detailed AI responses in
                      text format.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Private & quiet</span>
                    </div>
                  </div>
                </Link>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowInterviewDialog(false)}
                className="w-full rounded-xl"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

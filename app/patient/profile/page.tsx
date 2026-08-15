'use client';

import { useEffect, useState, Suspense } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Shield,
  ArrowLeft,
  Lock,
  CheckCircle,
  History,
  Heart,
  Pill,
  AlertTriangle,
  Stethoscope,
  Activity,
  Loader2,
  Download,
  Droplets,
  Scale,
  Ruler,
  Cigarette,
  Wine,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MedicalHistoryData {
  id: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  weight?: number;
  height?: number;
  familyHistory?: Record<string, boolean>;
  chronicConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  pastSurgeries?: string[];
  smokingStatus?: string;
  alcoholConsumption?: string;
  onboardingTranscript?: any[];
  isComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function ProfilePageContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'medical-history'>(
    'profile'
  );
  const [medicalHistory, setMedicalHistory] =
    useState<MedicalHistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Set initial tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'medical-history') {
      setActiveTab('medical-history');
    }
  }, [searchParams]);

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

  // Fetch medical history when tab is medical-history
  useEffect(() => {
    const fetchMedicalHistory = async () => {
      if (activeTab !== 'medical-history' || !user) return;
      setHistoryLoading(true);
      try {
        const res = await fetch('/api/medical-history');
        if (res.ok) {
          const result = await res.json();
          setMedicalHistory(result.data);
        }
      } catch (e) {
        console.error('Failed to fetch medical history:', e);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchMedicalHistory();
  }, [activeTab, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-blue-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSmokingStatus = (status?: string) => {
    if (!status) return 'Not provided';
    const labels: Record<string, string> = {
      never: 'Never smoked',
      former: 'Former smoker',
      current: 'Current smoker',
    };
    return labels[status] || status;
  };

  const formatAlcoholConsumption = (status?: string) => {
    if (!status) return 'Not provided';
    const labels: Record<string, string> = {
      never: 'Never',
      occasional: 'Occasional',
      regular: 'Regular',
    };
    return labels[status] || status;
  };

  const formatFamilyHistory = (history?: Record<string, boolean>) => {
    if (!history || Object.keys(history).length === 0) return null;
    const conditions = Object.entries(history)
      .filter(([_, value]) => value)
      .map(([key]) =>
        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      );
    return conditions.length > 0 ? conditions : null;
  };

  const formatArrayField = (arr?: string[]) => {
    if (!arr || arr.length === 0) return null;
    return arr;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/patient/dashboard">
                <Button variant="ghost" size="sm" className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
                <p className="text-sm text-gray-500 font-urdu">پروفائل</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex bg-gray-100 rounded-2xl p-1 max-w-md">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-primary shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              Account
            </button>
            <button
              onClick={() => setActiveTab('medical-history')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'medical-history'
                  ? 'bg-white text-primary shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4" />
              Medical History
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.section
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-md overflow-hidden mb-8"
            >
              <div className="bg-linear-to-r from-primary to-secondary p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-3xl font-bold text-primary shadow-lg">
                    {user?.name?.charAt(0) || 'P'}
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold">
                      {user?.name || 'Patient'}
                    </h2>
                    <p className="text-white/80">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Account Information
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Lock className="w-4 h-4" />
                    <span>Read-only</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  This information is from your login account and cannot be
                  edited here.
                </p>

                <div className="grid gap-4">
                  {/* Name Field */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-800">
                        {user?.name || 'Not provided'}
                      </p>
                    </div>
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Email Field */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-800">{user?.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {user?.emailVerified && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Account Created */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-800">
                        {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </p>
                    </div>
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Account Type</p>
                      <p className="font-medium text-gray-800 capitalize">
                        {user?.role || 'Patient'}
                      </p>
                    </div>
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="medical-history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Medical History Report Header */}
              <div className="bg-white rounded-3xl shadow-md overflow-hidden">
                <div className="bg-linear-to-r from-primary to-secondary p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-white">
                        <h2 className="text-2xl font-bold">
                          Medical History Report
                        </h2>
                        <p className="text-white/80 font-urdu">
                          طبی تاریخ رپورٹ
                        </p>
                      </div>
                    </div>
                    {medicalHistory?.isComplete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-lg"
                        onClick={() => window.print()}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : !medicalHistory?.isComplete ? (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Medical History Found
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Complete your medical history to get personalized
                        healthcare recommendations.
                      </p>
                      <Link href="/patient/medical_session">
                        <Button className="rounded-xl">
                          Complete Medical History
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Report Meta Info */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <div>
                          <p className="text-sm text-gray-500">Patient Name</p>
                          <p className="font-semibold text-gray-800">
                            {user?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="font-semibold text-gray-800">
                            {medicalHistory.updatedAt
                              ? formatDate(medicalHistory.updatedAt)
                              : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                          Complete
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Basic Information Section */}
              {medicalHistory?.isComplete && (
                <>
                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-500">Age</span>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {medicalHistory.age
                            ? `${medicalHistory.age} years`
                            : 'Not provided'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-500">Gender</span>
                        </div>
                        <p className="font-semibold text-gray-800 capitalize">
                          {medicalHistory.gender || 'Not provided'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-500">
                            Blood Group
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {medicalHistory.bloodGroup || 'Not provided'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-500">Weight</span>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {medicalHistory.weight
                            ? `${medicalHistory.weight} kg`
                            : 'Not provided'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Ruler className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm text-gray-500">Height</span>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {medicalHistory.height
                            ? `${medicalHistory.height} cm`
                            : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Conditions Section */}
                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Medical Conditions
                    </h3>
                    <div className="space-y-4">
                      {/* Chronic Conditions */}
                      <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-sm font-medium text-red-700 mb-2">
                          Chronic Conditions
                        </p>
                        {formatArrayField(medicalHistory.chronicConditions) ? (
                          <div className="flex flex-wrap gap-2">
                            {medicalHistory.chronicConditions?.map(
                              (condition, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-white text-red-700 rounded-lg text-sm border border-red-200"
                                >
                                  {condition}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No chronic conditions reported
                          </p>
                        )}
                      </div>

                      {/* Allergies */}
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <p className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Allergies
                        </p>
                        {formatArrayField(medicalHistory.allergies) ? (
                          <div className="flex flex-wrap gap-2">
                            {medicalHistory.allergies?.map((allergy, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-white text-orange-700 rounded-lg text-sm border border-orange-200"
                              >
                                {allergy}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No allergies reported
                          </p>
                        )}
                      </div>

                      {/* Current Medications */}
                      <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Current Medications
                        </p>
                        {formatArrayField(medicalHistory.currentMedications) ? (
                          <div className="flex flex-wrap gap-2">
                            {medicalHistory.currentMedications?.map(
                              (med, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-white text-green-700 rounded-lg text-sm border border-green-200"
                                >
                                  {med}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No current medications
                          </p>
                        )}
                      </div>

                      {/* Past Surgeries */}
                      <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
                        <p className="text-sm font-medium text-pink-700 mb-2 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Past Surgeries
                        </p>
                        {formatArrayField(medicalHistory.pastSurgeries) ? (
                          <div className="flex flex-wrap gap-2">
                            {medicalHistory.pastSurgeries?.map((surgery, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-white text-pink-700 rounded-lg text-sm border border-pink-200"
                              >
                                {surgery}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No past surgeries
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Family History Section */}
                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-cyan-500" />
                      Family Medical History
                    </h3>
                    <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                      {formatFamilyHistory(medicalHistory.familyHistory) ? (
                        <div className="flex flex-wrap gap-2">
                          {formatFamilyHistory(
                            medicalHistory.familyHistory
                          )?.map((condition, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-white text-cyan-700 rounded-lg text-sm border border-cyan-200"
                            >
                              {condition}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          No family history conditions reported
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lifestyle Section */}
                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      Lifestyle & Habits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Cigarette className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-500">
                            Smoking Status
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {formatSmokingStatus(medicalHistory.smokingStatus)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Wine className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-500">
                            Alcohol Consumption
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {formatAlcoholConsumption(
                            medicalHistory.alcoholConsumption
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-blue-50">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  LogOut,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import {
  getDepartmentFilterOptions,
  getDepartmentById,
  normalizeDepartmentId,
} from '@/lib/constants/departments';

interface Report {
  id: string;
  sessionId: string;
  patientName: string;
  patientId: string;
  age: number | null;
  complaint: string;
  department: string;
  status: string;
  timestamp: string;
  reviewedAt: string | null;
  redFlags: string[];
  urgency: string;
  triageLabel: string;
}

interface DoctorStats {
  pending: number;
  inReview: number;
  reviewed: number;
  total: number;
}

export default function DoctorDashboard() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'in-review' | 'reviewed'
  >('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<{
    department?: string;
    specialization?: string;
  } | null>(null);

  // Dynamic data states
  const [stats, setStats] = useState<DoctorStats>({
    pending: 0,
    inReview: 0,
    reviewed: 0,
    total: 0,
  });
  const [reports, setReports] = useState<{
    pending: Report[];
    inReview: Report[];
    reviewed: Report[];
  }>({
    pending: [],
    inReview: [],
    reviewed: [],
  });

  const [filters, setFilters] = useState({
    dateRange: 'all',
    priority: 'all',
    department: 'all',
  });

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

      // Check if doctor profile is complete
      try {
        const res = await fetch('/api/doctors');
        if (res.ok) {
          const payload = await res.json();
          if (!payload?.isComplete) {
            router.push('/doctor/onboarding');
            return;
          }
          setDoctorProfile(payload.data);
        } else {
          router.push('/doctor/onboarding');
          return;
        }
      } catch (e) {
        console.error('Failed to load doctor profile', e);
        router.push('/doctor/onboarding');
        return;
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
        const res = await fetch('/api/doctors/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setReports({
            pending: data.reports.pending,
            inReview: data.reports.inReview,
            reviewed: data.reports.reviewed,
          });
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

  // Get current tab's reports
  const getCurrentReports = () => {
    switch (activeTab) {
      case 'pending':
        return reports.pending;
      case 'in-review':
        return reports.inReview;
      case 'reviewed':
        return reports.reviewed;
      default:
        return [];
    }
  };

  const filteredReports = getCurrentReports().filter(report => {
    const matchesDepartment =
      filters.department === 'all' || report.department === filters.department;
    const matchesSearch =
      report.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.complaint.toLowerCase().includes(searchQuery.toLowerCase());

    // Date filter
    const now = new Date();
    const reportDate = new Date(report.timestamp);
    const matchesDate =
      filters.dateRange === 'all' ||
      (filters.dateRange === 'today' &&
        reportDate.toDateString() === now.toDateString()) ||
      (filters.dateRange === 'week' &&
        now.getTime() - reportDate.getTime() <= 7 * 24 * 60 * 60 * 1000) ||
      (filters.dateRange === 'month' &&
        now.getTime() - reportDate.getTime() <= 30 * 24 * 60 * 60 * 1000);

    // Priority filter
    const matchesPriority =
      filters.priority === 'all' || report.urgency === filters.priority;

    return matchesDepartment && matchesSearch && matchesDate && matchesPriority;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'Urgent';
      case 'medium':
        return 'Moderate';
      default:
        return 'Normal';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-PK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasActiveFilters =
    filters.dateRange !== 'all' ||
    filters.priority !== 'all' ||
    filters.department !== 'all';

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
      {/* Navbar - Patient Portal Style */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/doctor/dashboard" className="flex items-center gap-3">
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
                  placeholder="Search patients or complaints..."
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
                  {user?.name?.charAt(0) || 'D'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-800">
                    Dr. {user?.name?.split(' ')[0] || 'Doctor'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                    {user?.email}
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
                        Dr. {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                      {doctorProfile?.specialization && (
                        <p className="text-xs text-primary mt-1">
                          {doctorProfile.specialization}
                        </p>
                      )}
                    </div>
                    <div className="p-1">
                      <Link href="/doctor/profile">
                        <button
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                      </Link>
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
            Welcome,{' '}
            <span className="text-primary">
              Dr. {user?.name?.split(' ')[0] || 'Doctor'}
            </span>
          </h1>
          <p className="font-urdu text-secondary mt-1">
            مریضوں کی رپورٹس کا جائزہ لیں
          </p>
        </motion.div>

        {/* Search Bar (Mobile) */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patients or complaints..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Filter Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1" />
          <div className="relative">
            <Button
              variant="outline"
              className="rounded-xl px-4 py-2 border-gray-200"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </Button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-50"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-800">
                      Filter Reports
                    </h3>
                    <button
                      onClick={() =>
                        setFilters({
                          dateRange: 'all',
                          priority: 'all',
                          department: 'all',
                        })
                      }
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Department Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Department
                      </label>
                      <select
                        value={filters.department}
                        onChange={e =>
                          setFilters(prev => ({
                            ...prev,
                            department: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {getDepartmentFilterOptions().map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'all', label: 'All Time' },
                          { value: 'today', label: 'Today' },
                          { value: 'week', label: 'This Week' },
                          { value: 'month', label: 'This Month' },
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() =>
                              setFilters(prev => ({
                                ...prev,
                                dateRange: option.value,
                              }))
                            }
                            className={`p-3 rounded-xl text-sm font-medium transition-all ${
                              filters.dateRange === option.value
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Priority Level
                      </label>
                      <div className="space-y-2">
                        {[
                          {
                            value: 'all',
                            label: 'All Priorities',
                            color: 'bg-gray-50 text-gray-700',
                          },
                          {
                            value: 'high',
                            label: 'High Priority',
                            color: 'bg-red-50 text-red-700 border-red-200',
                          },
                          {
                            value: 'medium',
                            label: 'Medium Priority',
                            color:
                              'bg-yellow-50 text-yellow-700 border-yellow-200',
                          },
                          {
                            value: 'low',
                            label: 'Low Priority',
                            color:
                              'bg-green-50 text-green-700 border-green-200',
                          },
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() =>
                              setFilters(prev => ({
                                ...prev,
                                priority: option.value,
                              }))
                            }
                            className={`w-full p-3 rounded-xl text-sm font-medium transition-all border ${
                              filters.priority === option.value
                                ? 'bg-primary text-white shadow-md border-primary'
                                : `${option.color} hover:shadow-sm border-transparent`
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
                    <Button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 text-white bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-xl py-3 font-semibold"
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(false)}
                      className="px-6 rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs with Dynamic Counts */}
        <div className="mb-6">
          <div className="flex bg-white rounded-2xl p-1 shadow-sm max-w-lg border border-gray-100">
            {[
              {
                key: 'pending',
                label: 'Pending',
                icon: Clock,
                count: stats.pending,
              },
              {
                key: 'in-review',
                label: 'In Review',
                icon: FileText,
                count: stats.inReview,
              },
              {
                key: 'reviewed',
                label: 'Reviewed',
                icon: CheckCircle,
                count: stats.reviewed,
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() =>
                  setActiveTab(tab.key as 'pending' | 'in-review' | 'reviewed')
                }
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span
                  className={`ml-1 px-2 py-0.5 rounded-lg text-xs ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'
                  }`}
                >
                  {dataLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    tab.count
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reports Grid */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredReports.map(report => {
                const deptInfo = getDepartmentById(
                  normalizeDepartmentId(report.department)
                );
                const DeptIcon = deptInfo.icon;

                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {report.patientName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {report.age
                              ? `${report.age} years old`
                              : 'Age not specified'}
                          </p>
                        </div>
                      </div>
                      {/* Urgency + Department Pills */}
                      <div className="flex flex-col gap-1.5 items-end">
                        <div
                          className={`px-3 py-1 rounded-lg text-xs font-medium border ${getUrgencyColor(report.urgency)}`}
                        >
                          {getUrgencyLabel(report.urgency)}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <DeptIcon className="w-3 h-3" />
                          {deptInfo.name.split(' ')[0]}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{report.complaint}</p>

                    {report.redFlags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {report.redFlags.map((flag, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Clock className="w-4 h-4" />
                        {formatDate(report.timestamp)}
                      </div>
                      <Link href={`/doctor/report/${report.id}`}>
                        <Button
                          size="sm"
                          className="rounded-xl bg-primary hover:bg-primary/90 text-white"
                        >
                          Review
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredReports.length === 0 && (
              <div className="col-span-2 bg-white rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  No reports found
                </h3>
                <p className="text-gray-500">
                  {hasActiveFilters
                    ? 'No reports match your current filters. Try adjusting your filters.'
                    : `No ${activeTab === 'in-review' ? 'in review' : activeTab} reports at the moment.`}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

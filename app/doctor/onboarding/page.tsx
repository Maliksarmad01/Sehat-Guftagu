'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  GraduationCap,
  Building,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { getDepartmentOptions } from '@/lib/constants/departments';

interface FormErrors {
  [key: string]: string;
}

export default function DoctorOnboarding() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [roleConflict, setRoleConflict] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    specialization: '',
    qualification: '',
    experience: '',
    licenseNumber: '',
    hospital: '',
    department: '',
    bio: '',
  });
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        router.push('/login');
        setLoading(false);
        return;
      }

      setUser(data.user);

      // Pre-fill name from auth
      setFormData(prev => ({
        ...prev,
        fullName: data.user.name || '',
      }));

      // First check if user is already registered as a patient
      try {
        const roleCheckRes = await fetch('/api/user/role/check');
        if (roleCheckRes.ok) {
          const roleData = await roleCheckRes.json();
          if (roleData.isPatient) {
            // User is already a patient, show error
            setRoleConflict(true);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Failed to check role', e);
      }

      // Check if doctor profile already exists and is complete
      try {
        const res = await fetch('/api/doctors');
        if (res.ok) {
          const payload = await res.json();
          if (payload?.isComplete) {
            // Profile already complete, redirect to dashboard
            router.push('/doctor/dashboard');
            return;
          }
          // Pre-fill any existing data
          if (payload?.data) {
            const d = payload.data;
            setFormData(prev => ({
              ...prev,
              fullName: d.fullName || prev.fullName,
              phone: d.phone || prev.phone,
              address: d.address || prev.address,
              dateOfBirth: d.dateOfBirth || prev.dateOfBirth,
              specialization: d.specialization || prev.specialization,
              qualification: d.qualification || prev.qualification,
              experience: d.experience ? String(d.experience) : prev.experience,
              licenseNumber: d.licenseNumber || prev.licenseNumber,
              hospital: d.hospital || prev.hospital,
              department: d.department || prev.department,
              bio: d.bio || prev.bio,
            }));
          }
        }
      } catch (e) {
        console.error('Failed to load doctor profile', e);
      }

      setLoading(false);
    };
    getSession();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.specialization)
      newErrors.specialization = 'Specialization is required';
    if (!formData.qualification.trim())
      newErrors.qualification = 'Qualification is required';
    if (!formData.experience.trim())
      newErrors.experience = 'Experience is required';
    if (!formData.licenseNumber.trim())
      newErrors.licenseNumber = 'License number is required';
    if (!formData.hospital.trim())
      newErrors.hospital = 'Hospital/Clinic is required';
    if (!formData.department) newErrors.department = 'Department is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isComplete: true,
        }),
      });

      if (res.ok) {
        router.push('/doctor/dashboard');
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save doctor profile', err);

        // Check for role conflict error
        if (err.code === 'ROLE_CONFLICT') {
          setRoleConflict(true);
        } else {
          setErrors({
            submit: err.error || 'Failed to save profile. Please try again.',
          });
        }
      }
    } catch (e) {
      console.error('Error saving doctor profile', e);
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3d67b2] to-[#2a4a8a]">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Show role conflict error
  if (roleConflict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3d67b2] to-[#2a4a8a] p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Account Already Registered
          </h2>
          <p className="text-gray-600 mb-6">
            This email is already registered as a <strong>patient</strong>{' '}
            account. You cannot use the same email for both patient and doctor
            portals.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Please use a different email address to register as a doctor, or
            login as a patient.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/patient/dashboard')}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white"
            >
              Go to Patient Dashboard
            </Button>
            <Button
              onClick={async () => {
                await authClient.signOut();
                router.push('/login');
              }}
              variant="outline"
              className="w-full"
            >
              Sign Out & Use Different Email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3d67b2] to-[#2a4a8a]">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <Image
                src="/logo/sehat-guftagu-logo.svg"
                alt="Sehat Guftagu"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-semibold text-white">Doctor Registration</h1>
              <p className="text-xs text-white/60">Complete your profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <span className="text-white text-sm">{user?.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-12">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome, Dr. {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-white/70">
            Please complete your profile to start reviewing patient cases.
          </p>
          <p className="text-white/60 text-sm font-urdu mt-1">
            براہ کرم مریضوں کے کیسز دیکھنے کے لیے اپنا پروفائل مکمل کریں
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            {/* Error Message */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.fullName
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  placeholder="Dr. Ahmed Khan"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.phone
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  placeholder="+92 300 1234567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="City, Country"
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Stethoscope className="w-4 h-4 inline mr-2" />
                  Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.specialization
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                >
                  <option value="">Select Specialization</option>
                  {getDepartmentOptions().map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.specialization && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.specialization}
                  </p>
                )}
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Qualification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.qualification
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  placeholder="MBBS, FCPS, etc."
                />
                {errors.qualification && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.qualification}
                  </p>
                )}
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.experience
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  placeholder="e.g., 10"
                />
                {errors.experience && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.experience}
                  </p>
                )}
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  PMC License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.licenseNumber
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  placeholder="PMC-XXXXX"
                />
                {errors.licenseNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.licenseNumber}
                  </p>
                )}
              </div>

              {/* Hospital */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Hospital/Clinic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hospital"
                  value={formData.hospital}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.hospital
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  placeholder="Hospital Name"
                />
                {errors.hospital && (
                  <p className="text-red-500 text-xs mt-1">{errors.hospital}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.department
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                >
                  <option value="">Select Department</option>
                  {getDepartmentOptions().map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio / About
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Brief description about yourself and your expertise..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Complete Registration
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Info Note */}
        <p className="text-center text-white/50 text-xs mt-6">
          All fields marked with <span className="text-red-400">*</span> are
          required
        </p>
      </main>
    </div>
  );
}

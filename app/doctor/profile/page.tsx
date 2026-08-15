'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  GraduationCap,
  Building,
  Camera,
  Save,
  ChevronLeft,
  Loader2,
  Lock,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { getDepartmentOptions } from '@/lib/constants/departments';

export default function DoctorProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
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
    const getSessionAndProfile = async () => {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        router.push('/login');
        setLoading(false);
        return;
      }

      setUser(data.user);

      // First populate from auth user object (fast)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userData = data.user as any;
      setFormData({
        fullName: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        dateOfBirth: userData.dateOfBirth || '',
        specialization: userData.specialization || '',
        qualification: userData.qualification || '',
        experience: userData.experience || '',
        licenseNumber: userData.licenseNumber || '',
        hospital: userData.hospital || '',
        department: userData.department || '',
        bio: userData.bio || '',
      });
      setProfileImage(userData.profileImage || '');

      // Then fetch more complete doctor profile from Supabase via our API
      try {
        const res = await fetch('/api/doctors');
        if (res.ok) {
          const payload = await res.json();
          if (payload?.data) {
            const d = payload.data;
            setFormData(prev => ({
              ...prev,
              fullName: d.full_name || prev.fullName,
              email: d.email || prev.email,
              phone: d.phone || prev.phone,
              address: d.address || prev.address,
              dateOfBirth: d.date_of_birth || prev.dateOfBirth,
              specialization: d.specialization || prev.specialization,
              qualification: d.qualification || prev.qualification,
              experience: d.experience ? String(d.experience) : prev.experience,
              licenseNumber: d.license_number || prev.licenseNumber,
              hospital: d.hospital || prev.hospital,
              department: d.department || prev.department,
              bio: d.bio || prev.bio,
            }));
            setProfileImage(d.profile_image || profileImage);
          }
        }
      } catch (e) {
        console.error('Failed to load doctor profile from API', e);
      }

      setLoading(false);
    };
    getSessionAndProfile();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      // Post to our API which upserts the doctor profile in Supabase
      // Note: fullName and email are locked and not sent for update
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName, // Keep for initial setup only
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          specialization: formData.specialization,
          qualification: formData.qualification,
          experience: formData.experience,
          licenseNumber: formData.licenseNumber,
          hospital: formData.hospital,
          department: formData.department,
          bio: formData.bio,
          profileImage,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save doctor profile', err);
      }
    } catch (e) {
      console.error('Error saving doctor profile', e);
    }
    setSaving(false);
  };

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
                alt="Sehat Guftagu"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <div>
                <h1 className="font-semibold text-gray-800">Doctor Profile</h1>
                <p className="text-xs text-gray-500">Manage your profile</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center sticky top-24">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-primary" />
                  )}
                </div>
                <label className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-110">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Dr. {formData.fullName || 'Doctor'}
              </h2>
              <p className="text-primary font-medium mb-1">
                {formData.specialization || 'Medical Professional'}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                {formData.hospital || 'Healthcare Provider'}
              </p>
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  Experience
                </p>
                <p className="text-lg font-bold text-primary">
                  {formData.experience || '0'} Years
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  Profile Information
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Update your personal and professional details
                </p>
              </div>

              {/* Form */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        Personal Details
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          Full Name
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        </label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            readOnly
                            disabled
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                            placeholder="Full name from account"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Name is linked to your account and cannot be changed
                          here
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          Email Address
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            readOnly
                            disabled
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                            placeholder="Email from account"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Email is linked to your login credentials
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            rows={3}
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white resize-none"
                            placeholder="Enter your address"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        Professional Details
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Specialization <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                          <select
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
                          >
                            <option value="">Select specialization</option>
                            {getDepartmentOptions().map(dept => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Qualification <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            name="qualification"
                            value={formData.qualification}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
                            placeholder="e.g., MBBS, MD, FCPS"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Years of Experience{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          required
                          min="0"
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
                          placeholder="Enter years of experience"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Medical License Number{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
                          placeholder="Enter license number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Hospital/Clinic{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            name="hospital"
                            value={formData.hospital}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
                            placeholder="Enter hospital/clinic name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
                        >
                          <option value="">Select department</option>
                          {getDepartmentOptions().map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      Professional Bio
                    </h4>
                  </div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    About Yourself <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white resize-none"
                    placeholder="Write a brief professional bio about your experience, expertise, and approach to patient care..."
                  />
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          Changes saved successfully!
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving to Database...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

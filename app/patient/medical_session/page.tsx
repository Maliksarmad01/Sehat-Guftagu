'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useMedicalHistory } from '@/hooks/useMedicalHistory';
import { MedicalHistoryOnboarding } from '@/components/voice/MedicalHistoryOnboarding';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MedicalSessionPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roleConflict, setRoleConflict] = useState(false);
  const router = useRouter();

  const { isComplete, isLoading: medicalHistoryLoading } = useMedicalHistory();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);

        // Check if user is already registered as a doctor
        try {
          const roleCheckRes = await fetch('/api/user/role/check');
          if (roleCheckRes.ok) {
            const roleData = await roleCheckRes.json();
            if (roleData.isDoctor) {
              setRoleConflict(true);
            }
          }
        } catch (e) {
          console.error('Failed to check role', e);
        }
      }
      setLoading(false);
    };
    getSession();
  }, [router]);

  // If medical history is complete, redirect to dashboard
  useEffect(() => {
    if (!medicalHistoryLoading && isComplete) {
      router.push('/patient/dashboard');
    }
  }, [medicalHistoryLoading, isComplete, router]);

  const handleOnboardingComplete = () => {
    router.push('/patient/dashboard');
  };

  if (loading || medicalHistoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a3a5c] to-[#0d4a6e]">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Show role conflict error for doctors trying to access patient portal
  if (roleConflict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a3a5c] to-[#0d4a6e] p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Account Already Registered
          </h2>
          <p className="text-gray-600 mb-6">
            This email is already registered as a <strong>doctor</strong>{' '}
            account. You cannot use the same email for both patient and doctor
            portals.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Please use a different email address to register as a patient, or
            login as a doctor.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/doctor/dashboard')}
              className="w-full bg-gradient-to-r from-[#0a3a5c] to-[#0d4a6e] text-white"
            >
              Go to Doctor Dashboard
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

  // Show Medical History Onboarding - directly in Urdu Voice mode
  if (user && !isComplete) {
    return (
      <MedicalHistoryOnboarding
        userName={user?.name?.split(' ')[0] || 'Friend'}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a3a5c] to-[#0d4a6e]">
      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}

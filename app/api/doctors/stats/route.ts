/**
 * Doctor Dashboard Stats API
 *
 * Returns dynamic statistics and reports for the doctor dashboard
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a doctor - simplified check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can access this' },
        { status: 403 }
      );
    }

    const doctorId = session.user.id;

    console.log('\n📊 [Doctor Stats] Fetching dashboard data...');
    console.log('   Doctor ID:', doctorId);

    // DEBUG: Check ALL reports in the database first
    const allReportsDebug = await prisma.sOAPReport.findMany({
      select: {
        id: true,
        reviewStatus: true,
        createdAt: true,
      },
    });
    console.log('   📋 DEBUG - All reports in DB:', allReportsDebug.length);
    allReportsDebug.forEach(
      (
        r: { id: string; reviewStatus: string; createdAt: Date },
        i: number
      ) => {
      console.log(`      ${i + 1}. ID: ${r.id.slice(0, 8)}..., reviewStatus: "${r.reviewStatus}", created: ${r.createdAt}`);
      }
    );

    // Fetch all reports - pending ones for all doctors, and reviewed ones by this doctor
    const [pendingReports, inReviewReports, reviewedReports] =
      await Promise.all([
        // Pending reports - show ALL pending reports to all doctors
        prisma.sOAPReport.findMany({
          where: {
            reviewStatus: 'pending',
          },
          include: {
            session: {
              select: {
                chiefComplaint: true,
              },
            },
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        // In-review reports - show ALL in_review reports
        prisma.sOAPReport.findMany({
          where: {
            reviewStatus: 'in_review',
          },
          include: {
            session: {
              select: {
                chiefComplaint: true,
                patient: {
                  select: {
                    id: true,
                    name: true,
                    medicalHistory: {
                      select: {
                        age: true,
                      },
                    },
                  },
                },
              },
            },
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        // Reviewed reports - show ALL approved/rejected reports
        prisma.sOAPReport.findMany({
          where: {
            reviewStatus: { in: ['approved', 'rejected'] },
          },
          include: {
            session: {
              select: {
                chiefComplaint: true,
                patient: {
                  select: {
                    id: true,
                    name: true,
                    medicalHistory: {
                      select: {
                        age: true,
                      },
                    },
                  },
                },
              },
            },
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { reviewedAt: 'desc' },
          take: 50,
        }),
      ]);

    // Extract red flags from subjective data
    const extractRedFlags = (subjective: unknown): string[] => {
      if (!subjective || typeof subjective !== 'object') return [];
      const subj = subjective as Record<string, unknown>;
      if (Array.isArray(subj.redFlags)) {
        return subj.redFlags as string[];
      }
      return [];
    };

    // Format reports for frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatReport = (report: any) => ({
      id: report.id,
      sessionId: report.sessionId,
      patientName:
        report.patient?.name ||
        report.session?.patient?.name ||
        'Anonymous Patient',
      patientId: report.patient?.id || report.session?.patient?.id,
      age: report.session?.patient?.medicalHistory?.age || null,
      complaint: report.session?.chiefComplaint || 'Clinical Interview',
      department: report.department || 'general',
      status: report.reviewStatus || 'pending',
      timestamp: report.createdAt.toISOString(),
      reviewedAt: report.reviewedAt?.toISOString() || null,
      redFlags: extractRedFlags(report.subjective),
      urgency:
        report.triageLabel === 'emergency'
          ? 'high'
          : report.triageLabel === 'urgent'
            ? 'medium'
            : 'low',
      triageLabel: report.triageLabel || 'routine',
    });

    const formattedPending = pendingReports.map(formatReport);
    const formattedInReview = inReviewReports.map(formatReport);
    const formattedReviewed = reviewedReports.map(formatReport);

    console.log(
      `   ✅ Stats: ${formattedPending.length} pending, ${formattedInReview.length} in-review, ${formattedReviewed.length} reviewed`
    );

    // Stats
    const stats = {
      pending: formattedPending.length,
      inReview: formattedInReview.length,
      reviewed: formattedReviewed.length,
      total:
        formattedPending.length +
        formattedInReview.length +
        formattedReviewed.length,
    };

    return NextResponse.json({
      stats,
      reports: {
        pending: formattedPending,
        inReview: formattedInReview,
        reviewed: formattedReviewed,
      },
      doctorDepartment: 'general_medicine',
    });
  } catch (error) {
    console.error('❌ Error fetching doctor stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

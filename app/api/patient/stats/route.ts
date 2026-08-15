import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

// GET - Fetch patient dashboard stats
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('\n📊 [Patient Stats] Fetching stats for patient:', userId);

    // Get total clinical sessions
    const totalSessions = await prisma.clinicalSession.count({
      where: { patientId: userId },
    });

    // Get sessions with completed SOAP reports
    const reportsReady = await prisma.sOAPReport.count({
      where: {
        patientId: userId,
        reviewStatus: 'approved',
      },
    });

    // Get pending reviews
    const pendingReview = await prisma.sOAPReport.count({
      where: {
        patientId: userId,
        reviewStatus: { in: ['pending', 'in_review'] },
      },
    });

    console.log(
      `   📋 Total sessions: ${totalSessions}, Reports ready: ${reportsReady}, Pending: ${pendingReview}`
    );

    // Get recent sessions with SOAP reports
    const recentSessions = await prisma.clinicalSession.findMany({
      where: { patientId: userId },
      include: {
        soapReport: {
          select: {
            id: true,
            department: true,
            reviewStatus: true,
            prescription: true,
            doctorNotes: true,
            createdAt: true,
            reviewedAt: true,
            assignedDoctorId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Transform sessions for frontend
    const sessions = recentSessions.map(s => ({
      id: s.id,
      chiefComplaint: s.chiefComplaint || 'Clinical Interview',
      department: s.soapReport?.department || 'General',
      status:
        s.soapReport?.reviewStatus ||
        (s.status === 'completed' ? 'pending' : s.status),
      createdAt: s.createdAt.toISOString(),
      reportId: s.soapReport?.id || null,
      hasPrescription: !!s.soapReport?.prescription,
    }));

    // Get prescriptions from doctor-reviewed reports
    const prescriptions = await prisma.sOAPReport.findMany({
      where: {
        patientId: userId,
        reviewStatus: 'approved',
        prescription: { not: null },
      },
      include: {
        session: {
          select: {
            chiefComplaint: true,
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
      take: 10,
    });

    // Get doctor names for prescriptions
    const doctorIds = prescriptions
      .map(p => p.assignedDoctorId)
      .filter((id): id is string => id !== null);

    const doctors = await prisma.doctorProfile.findMany({
      where: { doctorId: { in: doctorIds } },
      select: {
        doctorId: true,
        fullName: true,
        specialization: true,
        hospital: true,
      },
    });

    const doctorMap = new Map(doctors.map(d => [d.doctorId, d]));

    const formattedPrescriptions = prescriptions.map(p => {
      const doctor = p.assignedDoctorId
        ? doctorMap.get(p.assignedDoctorId)
        : null;
      return {
        id: p.id,
        reportId: p.id,
        chiefComplaint: p.session?.chiefComplaint || 'Clinical Interview',
        department: p.department || 'General',
        prescription: p.prescription,
        doctorNotes: p.doctorNotes,
        doctorName: doctor?.fullName || 'Dr. Assigned',
        doctorSpecialization: doctor?.specialization || p.department,
        doctorHospital: doctor?.hospital,
        reviewedAt: p.reviewedAt?.toISOString() || p.updatedAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      stats: {
        totalSessions,
        reportsReady,
        pendingReview,
      },
      sessions,
      prescriptions: formattedPrescriptions,
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient stats' },
      { status: 500 }
    );
  }
}

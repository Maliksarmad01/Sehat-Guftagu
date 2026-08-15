/**
 * SOAP Report PDF Generation API
 *
 * POST - Generate PDF from report ID
 * GET - Get report data for viewing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { generateSOAPReportPDF, pdfToBase64 } from '@/lib/pdf-generator';

// GET - Fetch report data with patient info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the report with all related data
    const report = await prisma.sOAPReport.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            id: true,
            chiefComplaint: true,
            conversationLog: true,
            identifiedSymptoms: true,
            differentialDiagnosis: true,
            confidenceScore: true,
            createdAt: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            medicalHistory: {
              select: {
                age: true,
                gender: true,
                bloodGroup: true,
                weight: true,
                height: true,
                chronicConditions: true,
                currentMedications: true,
                allergies: true,
                familyHistory: true,
                smokingStatus: true,
                alcoholConsumption: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check access - patient can see their own, doctor can see assigned/pending
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role === 'patient' && report.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Format response
    const responseData = {
      id: report.id,
      sessionId: report.sessionId,
      patientId: report.patientId,
      patientName: report.patient?.name || 'Unknown',
      patientEmail: report.patient?.email,
      patientInfo: report.patient?.medicalHistory
        ? {
            age: report.patient.medicalHistory.age,
            gender: report.patient.medicalHistory.gender,
            bloodGroup: report.patient.medicalHistory.bloodGroup,
            weight: report.patient.medicalHistory.weight,
            height: report.patient.medicalHistory.height,
          }
        : null,
      medicalHistory: report.patient?.medicalHistory
        ? {
            chronicConditions: report.patient.medicalHistory.chronicConditions,
            currentMedications:
              report.patient.medicalHistory.currentMedications,
            allergies: report.patient.medicalHistory.allergies,
            familyHistory: report.patient.medicalHistory.familyHistory,
            smokingStatus: report.patient.medicalHistory.smokingStatus,
            alcoholConsumption:
              report.patient.medicalHistory.alcoholConsumption,
          }
        : null,
      subjective: report.subjective,
      objective: report.objective,
      assessment: report.assessment,
      plan: report.plan,
      department: report.department,
      priority: report.priority,
      reviewStatus: report.reviewStatus,
      assignedDoctorId: report.assignedDoctorId,
      doctorNotes: report.doctorNotes,
      prescription: report.prescription,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      reviewedAt: report.reviewedAt?.toISOString() || null,
      sessionDate:
        report.session?.createdAt.toISOString() ||
        report.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, report: responseData });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// POST - Generate PDF for a report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { returnBase64 = false } = body;

    // Fetch the report with all related data
    const report = await prisma.sOAPReport.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            createdAt: true,
          },
        },
        patient: {
          select: {
            name: true,
            medicalHistory: {
              select: {
                age: true,
                gender: true,
                bloodGroup: true,
                chronicConditions: true,
                currentMedications: true,
                allergies: true,
                familyHistory: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Parse the SOAP report sections from JSON storage (Prisma stores as Json)
    const subjective = report.subjective as {
      chiefComplaint: string;
      symptoms: string[];
      patientHistory: string;
      patientNarrative: string;
    };
    const objective = report.objective as {
      reportedSymptoms: string[];
      severity: string;
      confidenceLevel: number;
    };
    const assessment = report.assessment as {
      primaryDiagnosis: string;
      differentialDiagnosis: string[];
      severity: string;
      confidence: number;
      aiAnalysis: string;
      redFlags: string[];
      medicalSources?: string[];
    };
    const plan = report.plan as {
      recommendations: string[];
      testsNeeded: string[];
      specialistReferral?: string;
      followUpNeeded: boolean;
      urgency: string;
    };

    // Map triage label
    type TriageLabelType = 'emergency' | 'urgent' | 'standard' | 'routine';
    const triageLabel: TriageLabelType =
      report.priority === 'urgent' || report.priority === 'high'
        ? 'urgent'
        : report.priority === 'emergency'
          ? 'emergency'
          : 'standard';

    // Generate PDF
    const soapReport = {
      subjective,
      objective: {
        ...objective,
        severity: objective.severity as
          | 'critical'
          | 'high'
          | 'moderate'
          | 'initial'
          | 'normal',
      },
      assessment: {
        ...assessment,
        severity: assessment.severity as
          | 'critical'
          | 'high'
          | 'moderate'
          | 'initial'
          | 'normal',
        medicalSources: assessment.medicalSources || [],
      },
      plan: {
        ...plan,
        urgency: triageLabel,
      },
      metadata: {
        generatedAt: report.createdAt.toISOString(),
        sessionId: report.sessionId,
        patientId: report.patientId,
        department: report.department || undefined,
        triageLabel,
        aiVersion: 'sehat-guftagu-v2.0',
      },
    };

    const pdfBytes = generateSOAPReportPDF({
      report: soapReport,
      patientInfo: {
        name: report.patient?.name || 'Unknown',
        age: report.patient?.medicalHistory?.age || undefined,
        gender: report.patient?.medicalHistory?.gender || undefined,
        bloodGroup: report.patient?.medicalHistory?.bloodGroup || undefined,
        mrn: report.patientId.slice(0, 12),
      },
      medicalHistory: report.patient?.medicalHistory
        ? {
            chronicConditions: report.patient.medicalHistory
              .chronicConditions as string[],
            currentMedications: report.patient.medicalHistory
              .currentMedications as string[],
            allergies: report.patient.medicalHistory.allergies as string[],
            familyHistory: report.patient.medicalHistory
              .familyHistory as Record<string, boolean>,
          }
        : undefined,
      sessionDate:
        report.session?.createdAt.toLocaleDateString() ||
        new Date().toLocaleDateString(),
    });

    if (returnBase64) {
      // Return base64 for storage
      const base64 = pdfToBase64(pdfBytes);
      return NextResponse.json({
        success: true,
        pdfBase64: base64,
        filename: `SOAP_Report_${report.id.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`,
      });
    }

    // Return PDF directly for download - Convert Uint8Array to Buffer for NextResponse
    const buffer = Buffer.from(pdfBytes);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SOAP_Report_${report.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// PUT - Claim report for review (doctor only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Verify user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { doctorProfile: true },
    });

    if (user?.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can perform this action' },
        { status: 403 }
      );
    }

    if (action === 'claim') {
      // Claim the report for review
      const updated = await prisma.sOAPReport.update({
        where: { id },
        data: {
          assignedDoctorId: session.user.id,
          reviewStatus: 'in_review',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, report: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

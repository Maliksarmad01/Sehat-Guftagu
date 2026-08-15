/**
 * Prescription API
 *
 * GET - Download prescription PDF (for patients)
 * POST - Generate and save prescription PDF (for doctors)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { generatePrescriptionPDF, pdfToBase64 } from '@/lib/pdf-generator';

// GET - Download prescription PDF (for patients)
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

    // Fetch the report with patient info
    const report = await prisma.sOAPReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify user is the patient who owns this report
    if (report.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if report has a prescription
    if (!report.prescription) {
      return NextResponse.json(
        { error: 'No prescription available for this report' },
        { status: 404 }
      );
    }

    // Fetch patient info separately
    const patient = await prisma.user.findUnique({
      where: { id: report.patientId },
      select: {
        name: true,
        medicalHistory: {
          select: {
            age: true,
            gender: true,
          },
        },
      },
    });

    // Fetch doctor info if assigned
    let doctorInfo = null;
    if (report.assignedDoctorId) {
      doctorInfo = await prisma.user.findUnique({
        where: { id: report.assignedDoctorId },
        select: {
          name: true,
          email: true,
          doctorProfile: {
            select: {
              specialization: true,
              licenseNumber: true,
              hospital: true,
              phone: true,
            },
          },
        },
      });
    }

    // Get primary diagnosis from assessment
    const assessment = report.assessment as Record<string, unknown>;
    const diagnosis =
      (assessment?.primaryDiagnosis as string) || 'Clinical evaluation';

    // Generate PDF with doctor details
    const pdfBytes = generatePrescriptionPDF({
      patientName: patient?.name || 'Patient',
      patientAge: patient?.medicalHistory?.age || undefined,
      patientGender: patient?.medicalHistory?.gender || undefined,
      diagnosis,
      prescription: report.prescription,
      doctorName: doctorInfo?.name || 'Doctor',
      doctorSpecialization:
        doctorInfo?.doctorProfile?.specialization || undefined,
      doctorLicense: doctorInfo?.doctorProfile?.licenseNumber || undefined,
      doctorHospital: doctorInfo?.doctorProfile?.hospital || undefined,
      doctorPhone: doctorInfo?.doctorProfile?.phone || undefined,
      doctorEmail: doctorInfo?.email || undefined,
      includeDockerDetails: true, // Always include doctor details for patient downloads
      date: new Date(report.reviewedAt || report.createdAt).toLocaleDateString(
        'en-PK',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      ),
    });

    // Return PDF directly
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Prescription_${report.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading prescription:', error);
    return NextResponse.json(
      { error: 'Failed to download prescription' },
      { status: 500 }
    );
  }
}

// POST - Generate prescription PDF (for doctors)
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
    const {
      prescription,
      includeDoctorDetails = false,
      returnBase64 = false,
    } = body;

    // Verify user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { doctorProfile: true },
    });

    if (user?.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can generate prescriptions' },
        { status: 403 }
      );
    }

    // Fetch the report with patient info
    const report = await prisma.sOAPReport.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            name: true,
            medicalHistory: {
              select: {
                age: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get primary diagnosis from assessment
    const assessment = report.assessment as Record<string, unknown>;
    const diagnosis =
      (assessment?.primaryDiagnosis as string) || 'Clinical evaluation';

    // Generate PDF
    const pdfBytes = generatePrescriptionPDF({
      patientName: report.patient?.name || 'Patient',
      patientAge: report.patient?.medicalHistory?.age || undefined,
      patientGender: report.patient?.medicalHistory?.gender || undefined,
      diagnosis,
      prescription: prescription || 'No prescription provided',
      doctorName: user.name || 'Doctor',
      doctorSpecialization: user.doctorProfile?.specialization || undefined,
      doctorLicense: user.doctorProfile?.licenseNumber || undefined,
      doctorHospital: user.doctorProfile?.hospital || undefined,
      doctorPhone: user.doctorProfile?.phone || undefined,
      doctorEmail: user.email || undefined,
      includeDockerDetails: includeDoctorDetails,
      date: new Date().toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });

    // Update report with prescription
    await prisma.sOAPReport.update({
      where: { id },
      data: {
        prescription,
        assignedDoctorId: user.id,
        reviewStatus: 'approved',
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (returnBase64) {
      const base64 = pdfToBase64(pdfBytes);
      return NextResponse.json({
        success: true,
        pdfBase64: base64,
        filename: `Prescription_${report.id.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`,
      });
    }

    // Return PDF directly
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Prescription_${report.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to generate prescription' },
      { status: 500 }
    );
  }
}

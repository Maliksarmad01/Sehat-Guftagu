/**
 * Doctor Review API
 *
 * POST - Submit doctor review with feedback
 * PUT - Update report based on doctor feedback (regeneration)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { processDoctorReview } from '@/lib/agents/feedback-agent';

// POST - Submit doctor review
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
      action, // 'approve' | 'reject' | 'request_changes'
      feedback,
      starRating,
      rejectionReason,
      prescription,
      doctorNotes,
    } = body;

    // Verify user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { doctorProfile: true },
    });

    if (user?.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can review reports' },
        { status: 403 }
      );
    }

    // Process the review through the feedback agent
    const result = await processDoctorReview({
      reportId: id,
      doctorId: session.user.id,
      action,
      feedback,
      starRating,
      rejectionReason,
      prescription,
      doctorNotes,
    });

    // If approved, also update reviewedAt timestamp
    if (result.finalStatus === 'approved') {
      await prisma.sOAPReport.update({
        where: { id },
        data: {
          reviewedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      result: {
        finalStatus: result.finalStatus,
        needsRegeneration: result.needsRegeneration,
        hasRegeneratedReport: !!result.regeneratedReport,
        updatedInDb: result.updatedInDb,
      },
    });
  } catch (error) {
    console.error('Error processing review:', error);
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    );
  }
}

// PUT - Regenerate report based on feedback
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
    const { feedback, starRating } = body;

    // Verify user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can regenerate reports' },
        { status: 403 }
      );
    }

    // Process regeneration through feedback agent with request_changes action
    const result = await processDoctorReview({
      reportId: id,
      doctorId: session.user.id,
      action: 'request_changes',
      feedback,
      starRating: starRating || 2, // Low rating triggers regeneration
      rejectionReason: feedback,
    });

    // Fetch updated report
    const updatedReport = await prisma.sOAPReport.findUnique({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      regenerated: result.needsRegeneration,
      report: updatedReport
        ? {
            subjective: updatedReport.subjective,
            objective: updatedReport.objective,
            assessment: updatedReport.assessment,
            plan: updatedReport.plan,
          }
        : null,
    });
  } catch (error) {
    console.error('Error regenerating report:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate report' },
      { status: 500 }
    );
  }
}

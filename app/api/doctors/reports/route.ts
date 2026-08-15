/**
 * Doctor Reports Review API - Multi-Agent Orchestration
 *
 * This endpoint uses the Feedback Agent for doctor reviews:
 * - GET: Fetch pending reports for doctor review
 * - POST: Process doctor approval/rejection with feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { orchestrateDoctorReview, getDoctorPendingReports } from '@/lib/agents';
import type { DoctorAction } from '@/lib/agents';
import prisma from '@/lib/prisma';

// GET - Fetch pending reports for doctor review
export async function GET(request: NextRequest) {
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
                { error: 'Only doctors can access reports' },
                { status: 403 }
            );
        }

        const doctorId = session.user.id;

        console.log('\n📋 Fetching pending reports for doctor:', doctorId);

        // Get pending reports using feedback agent
        const pendingReports = await getDoctorPendingReports(doctorId);

        // Also get reports the doctor has already reviewed
        const reviewedReports = await prisma.sOAPReport.findMany({
            where: {
                assignedDoctorId: doctorId,
                reviewStatus: { in: ['approved', 'rejected'] },
            },
            include: {
                session: {
                    select: {
                        chiefComplaint: true,
                        patient: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { reviewedAt: 'desc' },
            take: 20,
        });

        const formattedReviewed = reviewedReports.map((report: any) => ({
            id: report.id,
            sessionId: report.sessionId,
            patientName: report.session?.patient?.name || 'Anonymous',
            chiefComplaint: report.session?.chiefComplaint || 'Clinical Interview',
            department: report.department,
            triageLabel: report.triageLabel,
            reviewStatus: report.reviewStatus,
            createdAt: report.createdAt.toISOString(),
            reviewedAt: report.reviewedAt?.toISOString(),
        }));

        console.log(
            `✅ Found ${pendingReports.length} pending, ${formattedReviewed.length} reviewed reports`
        );

        return NextResponse.json({
            pending: pendingReports,
            reviewed: formattedReviewed,
            total: pendingReports.length + formattedReviewed.length,
        });
    } catch (error) {
        console.error('❌ Error fetching doctor reports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}

// POST - Process doctor review (approve/reject/regenerate)
export async function POST(request: NextRequest) {
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
                { error: 'Only doctors can review reports' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { reportId, action, feedback, prescription, notes } = body;

        if (!reportId || !action) {
            return NextResponse.json(
                { error: 'reportId and action are required' },
                { status: 400 }
            );
        }

        if (!['approve', 'reject', 'request_changes'].includes(action)) {
            return NextResponse.json(
                {
                    error: 'Invalid action. Must be approve, reject, or request_changes',
                },
                { status: 400 }
            );
        }

        console.log('\n' + '👨‍⚕️'.repeat(20));
        console.log('📝 DOCTOR REVIEW - FEEDBACK AGENT');
        console.log('   Report:', reportId);
        console.log('   Action:', action);
        console.log('   Doctor:', session.user.id);
        if (feedback) console.log('   Feedback:', feedback.slice(0, 100) + '...');
        console.log('👨‍⚕️'.repeat(20) + '\n');

        // Run the feedback agent orchestration
        const result = await orchestrateDoctorReview({
            reportId,
            doctorId: session.user.id,
            action: action as DoctorAction,
            feedback: feedback || undefined,
            prescription: prescription || undefined,
            doctorNotes: notes || undefined,
        });

        console.log('\n═'.repeat(60));
        console.log('✅ FEEDBACK AGENT RESULT:');
        console.log('   Status:', result.finalStatus);
        console.log('   Needs Regeneration:', result.needsRegeneration);
        if (result.regeneratedReport) {
            console.log('   Regenerated Report: Yes');
        }
        console.log('═'.repeat(60) + '\n');

        return NextResponse.json({
            success: result.updatedInDb,
            message: result.finalStatus,
            needsRegeneration: result.needsRegeneration,
            regeneratedReport: result.regeneratedReport,
        });
    } catch (error) {
        console.error('❌ Error processing doctor review:', error);
        return NextResponse.json(
            { error: 'Failed to process review', details: String(error) },
            { status: 500 }
        );
    }
}

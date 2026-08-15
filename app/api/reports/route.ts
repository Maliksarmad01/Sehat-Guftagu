import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Fetch patient's reports
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch SOAP reports for this patient
        const soapReports = await prisma.sOAPReport.findMany({
            where: { patientId: session.user.id },
            include: {
                session: {
                    select: {
                        chiefComplaint: true,
                        createdAt: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        // Transform data for frontend
        const reports = soapReports.map((report: any) => ({
            id: report.id,
            sessionId: report.sessionId,
            status: report.reviewStatus,
            chiefComplaint: report.session?.chiefComplaint || "Clinical Interview",
            department: report.department,
            createdAt: report.createdAt.toISOString(),
            reviewedAt: report.reviewedAt?.toISOString() || null,
            doctorName: report.assignedDoctorId ? "Dr. Assigned" : null, // TODO: Fetch actual doctor name
            prescription: report.prescription,
            doctorNotes: report.doctorNotes,
        }));

        return NextResponse.json({ reports });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json(
            { error: "Failed to fetch reports" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Check if current user has a conflicting role
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                medicalHistory: true,
                doctorProfile: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has completed patient medical history
        const isPatient = user.medicalHistory?.isComplete === true;
        
        // Check if user has completed doctor profile
        const isDoctor = user.doctorProfile?.isComplete === true;

        return NextResponse.json({
            currentRole: user.role,
            isPatient,
            isDoctor,
            hasPatientData: !!user.medicalHistory,
            hasDoctorData: !!user.doctorProfile,
        });
    } catch (error) {
        console.error("Error checking user role:", error);
        return NextResponse.json(
            { error: "Failed to check user role" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Check if user exists and their role
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { 
                id: true, 
                role: true, 
                email: true,
            }
        });

        if (!user) {
            return NextResponse.json({ 
                exists: false, 
                role: null,
                profileComplete: false 
            });
        }

        // Check if doctor profile is complete
        let profileComplete = false;
        if (user.role === "doctor") {
            const doctorProfile = await prisma.doctorProfile.findUnique({
                where: { doctorId: user.id },
                select: { isComplete: true }
            });
            profileComplete = doctorProfile?.isComplete ?? false;
        } else if (user.role === "patient") {
            const medicalHistory = await prisma.medicalHistory.findUnique({
                where: { patientId: user.id },
                select: { isComplete: true }
            });
            profileComplete = medicalHistory?.isComplete ?? false;
        }

        return NextResponse.json({ 
            exists: true, 
            role: user.role,
            profileComplete
        });
    } catch (error) {
        console.error("Error checking user:", error);
        return NextResponse.json(
            { error: "Failed to check user" },
            { status: 500 }
        );
    }
}

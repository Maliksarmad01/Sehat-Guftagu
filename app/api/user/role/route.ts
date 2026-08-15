import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// POST - Update user role after signup
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { role } = body;

        if (!role || !["patient", "doctor"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Check if user already has a different role with profile data
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

        // If trying to switch to doctor but has patient medical history
        if (role === "doctor" && user.medicalHistory?.isComplete) {
            return NextResponse.json({ 
                error: "This account is registered as a patient. Please use a different email for doctor registration.",
                code: "ROLE_CONFLICT"
            }, { status: 409 });
        }

        // If trying to switch to patient but has doctor profile
        if (role === "patient" && user.doctorProfile?.isComplete) {
            return NextResponse.json({ 
                error: "This account is registered as a doctor. Please use a different email for patient registration.",
                code: "ROLE_CONFLICT"
            }, { status: 409 });
        }

        // Update the role
        await prisma.user.update({
            where: { id: session.user.id },
            data: { role }
        });

        return NextResponse.json({ success: true, role });
    } catch (error) {
        console.error("Error updating user role:", error);
        return NextResponse.json(
            { error: "Failed to update role" },
            { status: 500 }
        );
    }
}

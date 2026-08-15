import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Fetch doctor's profile
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doctorProfile = await prisma.doctorProfile.findUnique({
            where: { doctorId: session.user.id },
        });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, name: true, role: true }
        });

        return NextResponse.json({
            exists: !!doctorProfile,
            isComplete: doctorProfile?.isComplete ?? false,
            data: doctorProfile ? {
                ...doctorProfile,
                email: user?.email,
            } : null,
            user: user
        });
    } catch (error) {
        console.error("Error fetching doctor profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch doctor profile" },
            { status: 500 }
        );
    }
}

// POST - Create or update doctor profile
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is already a patient with completed medical history
        const existingUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { medicalHistory: true }
        });

        if (existingUser?.medicalHistory?.isComplete) {
            return NextResponse.json({
                error: "This account is registered as a patient. Please use a different email for doctor registration.",
                code: "ROLE_CONFLICT"
            }, { status: 409 });
        }

        const body = await request.json();
        const {
            fullName,
            phone,
            address,
            dateOfBirth,
            specialization,
            qualification,
            experience,
            licenseNumber,
            hospital,
            department,
            bio,
            profileImage,
            isComplete,
        } = body;

        // Prepare the data
        const preparedData = {
            fullName: fullName || null,
            phone: phone || null,
            address: address || null,
            dateOfBirth: dateOfBirth || null,
            specialization: specialization || null,
            qualification: qualification || null,
            experience: experience ? parseInt(experience) : null,
            licenseNumber: licenseNumber || null,
            hospital: hospital || null,
            department: department || null,
            bio: bio || null,
            profileImage: profileImage || null,
            isComplete: isComplete ?? false,
        };

        const doctorProfile = await prisma.doctorProfile.upsert({
            where: { doctorId: session.user.id },
            update: preparedData,
            create: {
                doctorId: session.user.id,
                ...preparedData,
            },
        });

        // Also update the user's role to doctor if not already
        await prisma.user.update({
            where: { id: session.user.id },
            data: { role: "doctor" }
        });

        return NextResponse.json({ success: true, data: doctorProfile });
    } catch (error) {
        console.error("Error saving doctor profile:", error);
        return NextResponse.json(
            { error: "Failed to save doctor profile" },
            { status: 500 }
        );
    }
}

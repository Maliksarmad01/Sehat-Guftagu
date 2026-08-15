import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

// GET - Check if user has medical history
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const medicalHistory = await prisma.medicalHistory.findUnique({
            where: { patientId: session.user.id },
        });

        return NextResponse.json({
            exists: !!medicalHistory,
            isComplete: medicalHistory?.isComplete ?? false,
            data: medicalHistory,
        });
    } catch (error) {
        console.error("Error fetching medical history:", error);
        return NextResponse.json(
            { error: "Failed to fetch medical history" },
            { status: 500 }
        );
    }
}

// POST - Create or update medical history
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            age,
            gender,
            bloodGroup,
            weight,
            height,
            familyHistory,
            chronicConditions,
            currentMedications,
            allergies,
            pastSurgeries,
            smokingStatus,
            alcoholConsumption,
            onboardingTranscript,
            isComplete,
        } = body;

        // Helper function to ensure array format
        const toArray = (value: any): string[] => {
            if (!value) return [];
            if (Array.isArray(value)) return value.filter(v => v && v.trim());
            if (typeof value === "string" && value.trim()) return [value.trim()];
            return [];
        };

        // Prepare the data with proper types
        const preparedData = {
            age: age ? parseInt(age) : null,
            gender: gender || null,
            bloodGroup: bloodGroup || null,
            weight: weight ? parseFloat(weight) : null,
            height: height ? parseFloat(height) : null,
            familyHistory: familyHistory || {},
            chronicConditions: toArray(chronicConditions),
            currentMedications: toArray(currentMedications),
            allergies: toArray(allergies),
            pastSurgeries: toArray(pastSurgeries),
            smokingStatus: smokingStatus || null,
            alcoholConsumption: alcoholConsumption || null,
            onboardingTranscript: onboardingTranscript || [],
            isComplete: isComplete ?? false,
        };

        const medicalHistory = await prisma.medicalHistory.upsert({
            where: { patientId: session.user.id },
            update: preparedData,
            create: {
                patientId: session.user.id,
                ...preparedData,
            },
        });

        return NextResponse.json({ success: true, data: medicalHistory });
    } catch (error) {
        console.error("Error saving medical history:", error);
        return NextResponse.json(
            { error: "Failed to save medical history" },
            { status: 500 }
        );
    }
}

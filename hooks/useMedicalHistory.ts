"use client";

import { useState, useEffect } from "react";

interface MedicalHistoryStatus {
    exists: boolean;
    isComplete: boolean;
    data: MedicalHistoryData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export interface MedicalHistoryData {
    id: string;
    patientId: string;
    age: number | null;
    gender: string | null;
    bloodGroup: string | null;
    weight: number | null;
    height: number | null;
    familyHistory: Record<string, boolean>;
    chronicConditions: string[];
    currentMedications: string[];
    allergies: string[];
    pastSurgeries: string[];
    smokingStatus: string | null;
    alcoholConsumption: string | null;
    onboardingTranscript: Array<{ role: string; content: string; timestamp: string }>;
    isComplete: boolean;
    createdAt: string;
    updatedAt: string;
}

export function useMedicalHistory(): MedicalHistoryStatus {
    const [exists, setExists] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [data, setData] = useState<MedicalHistoryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMedicalHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/medical-history");
            
            if (!response.ok) {
                throw new Error("Failed to fetch medical history");
            }

            const result = await response.json();
            setExists(result.exists);
            setIsComplete(result.isComplete);
            setData(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicalHistory();
    }, []);

    return {
        exists,
        isComplete,
        data,
        isLoading,
        error,
        refetch: fetchMedicalHistory,
    };
}

// Hook for saving medical history
export function useSaveMedicalHistory() {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const saveMedicalHistory = async (data: Partial<MedicalHistoryData>) => {
        try {
            setIsSaving(true);
            setError(null);

            const response = await fetch("/api/medical-history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to save medical history");
            }

            const result = await response.json();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            setError(errorMessage);
            throw err;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        saveMedicalHistory,
        isSaving,
        error,
    };
}

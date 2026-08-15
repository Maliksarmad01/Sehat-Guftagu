import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "medical-fast-search";

export const getIndex = () => {
    return pinecone.index(INDEX_NAME);
};

export const NAMESPACES = {
    MEDICAL_KNOWLEDGE: "", // Data is in default namespace
    USER_HISTORY: "user-history",
};

// Query medical knowledge for symptoms/diseases
export async function queryMedicalKnowledge(
    embedding: number[],
    topK: number = 5
): Promise<{ context: string; sources: string[]; diseases: string[] }> {
    const index = getIndex();

    try {
        const results = await index.namespace(NAMESPACES.MEDICAL_KNOWLEDGE).query({
            vector: embedding,
            topK,
            includeMetadata: true,
        });

        // Filter results by threshold > 0.25 as per Master Prompt
        const validMatches = results.matches?.filter(match => (match.score || 0) > 0.25) || [];

        const context = validMatches
            .map((match) => {
                const meta = match.metadata as any;
                if (!meta) return "";
                return `
Subject: ${meta.subject || "General"}
Question: ${meta.question || "N/A"}
Answer: ${meta.answer || "N/A"}
Explanation: ${meta.explanation || "N/A"}
`;
            })
            .filter(text => text.length > 50) // Filter out empty/short records
            .join("\n\n") || "";

        const sources = validMatches
            .map((match) => match.metadata?.source || match.id)
            .filter(Boolean) as string[] || [];

        // Extract disease names from metadata
        const diseases = validMatches
            .map((match) => match.metadata?.disease || match.metadata?.condition || "")
            .filter(Boolean) as string[] || [];

        return { context, sources, diseases: [...new Set(diseases)] };
    } catch (error) {
        console.error("Error querying medical knowledge:", error);
        return { context: "", sources: [], diseases: [] };
    }
}

// Search for specific disease information
export async function searchDiseaseInfo(
    embedding: number[],
    diseaseName: string,
    topK: number = 3
): Promise<{ symptoms: string[]; description: string; severity: string }> {
    const index = getIndex();

    try {
        const results = await index.namespace(NAMESPACES.MEDICAL_KNOWLEDGE).query({
            vector: embedding,
            topK,
            includeMetadata: true,
        });

        let symptoms: string[] = [];
        let description = "";
        let severity = "moderate";

        results.matches?.forEach((match) => {
            const meta = match.metadata as any;

            // Extract symptoms
            if (meta?.symptoms) {
                if (Array.isArray(meta.symptoms)) {
                    symptoms.push(...meta.symptoms);
                } else {
                    symptoms.push(meta.symptoms);
                }
            }

            // Extract description
            if (meta?.description || meta?.text) {
                description += (meta.description || meta.text) + " ";
            }

            // Extract severity if available
            if (meta?.severity) {
                severity = meta.severity;
            }
        });

        return {
            symptoms: [...new Set(symptoms)],
            description: description.trim().slice(0, 500),
            severity,
        };
    } catch (error) {
        console.error("Error searching disease info:", error);
        return { symptoms: [], description: "", severity: "moderate" };
    }
}

// Get differential diagnosis based on symptoms
export async function getDifferentialDiagnosis(
    embedding: number[],
    symptoms: string[],
    topK: number = 10
): Promise<Array<{ disease: string; matchScore: number; matchedSymptoms: string[] }>> {
    const index = getIndex();

    try {
        const results = await index.namespace(NAMESPACES.MEDICAL_KNOWLEDGE).query({
            vector: embedding,
            topK,
            includeMetadata: true,
        });

        const diseaseMap = new Map<string, { score: number; symptoms: string[] }>();

        results.matches?.forEach((match) => {
            const meta = match.metadata as any;
            const disease = meta?.disease || meta?.condition || meta?.title || "";
            const diseaseSymptoms = meta?.symptoms || [];

            if (disease) {
                // Calculate match score based on symptom overlap
                const matchedSymptoms = symptoms.filter(s =>
                    diseaseSymptoms.some((ds: string) =>
                        ds.toLowerCase().includes(s.toLowerCase()) ||
                        s.toLowerCase().includes(ds.toLowerCase())
                    )
                );

                const existing = diseaseMap.get(disease);
                const score = (match.score || 0) + (matchedSymptoms.length * 0.1);

                if (!existing || existing.score < score) {
                    diseaseMap.set(disease, {
                        score,
                        symptoms: matchedSymptoms
                    });
                }
            }
        });

        return Array.from(diseaseMap.entries())
            .map(([disease, data]) => ({
                disease,
                matchScore: data.score,
                matchedSymptoms: data.symptoms,
            }))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

    } catch (error) {
        console.error("Error getting differential diagnosis:", error);
        return [];
    }
}

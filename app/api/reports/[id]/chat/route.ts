/**
 * Chat with Report API
 *
 * POST - Chat with the SOAP report using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { ChatGroq } from '@langchain/groq';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const groqLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
});

// POST - Ask questions about the report
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
    const { question, chatHistory = [] } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Fetch the report
    const report = await prisma.sOAPReport.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            conversationLog: true,
            identifiedSymptoms: true,
            differentialDiagnosis: true,
          },
        },
        patient: {
          select: {
            name: true,
            medicalHistory: {
              select: {
                age: true,
                gender: true,
                bloodGroup: true,
                chronicConditions: true,
                currentMedications: true,
                allergies: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Build context from report
    const subjective = report.subjective as any;
    const objective = report.objective as any;
    const assessment = report.assessment as any;
    const plan = report.plan as any;

    const reportContext = `
=== SOAP CLINICAL REPORT ===

PATIENT INFORMATION:
- Name: ${report.patient?.name || 'Not specified'}
- Age: ${report.patient?.medicalHistory?.age || 'Not specified'}
- Gender: ${report.patient?.medicalHistory?.gender || 'Not specified'}
- Blood Group: ${report.patient?.medicalHistory?.bloodGroup || 'Not specified'}
- Chronic Conditions: ${(report.patient?.medicalHistory?.chronicConditions as string[])?.join(', ') || 'None'}
- Current Medications: ${(report.patient?.medicalHistory?.currentMedications as string[])?.join(', ') || 'None'}
- Allergies: ${(report.patient?.medicalHistory?.allergies as string[])?.join(', ') || 'None'}

SUBJECTIVE:
- Chief Complaint: ${subjective?.chiefComplaint || 'Not specified'}
- Symptoms: ${subjective?.symptoms?.join(', ') || 'Not specified'}
- Patient Narrative: ${subjective?.patientNarrative || 'Not specified'}
- Medical History: ${subjective?.patientHistory || 'Not specified'}

OBJECTIVE:
- Reported Symptoms: ${objective?.reportedSymptoms?.join(', ') || 'Not specified'}
- Severity: ${objective?.severity || 'Not specified'}
- Confidence Level: ${objective?.confidenceLevel || 'Not specified'}%

ASSESSMENT:
- Primary Diagnosis: ${assessment?.primaryDiagnosis || 'Not specified'}
- Differential Diagnoses: ${assessment?.differentialDiagnosis?.join(', ') || 'Not specified'}
- Severity: ${assessment?.severity || 'Not specified'}
- Confidence: ${assessment?.confidence || 'Not specified'}%
- AI Analysis: ${assessment?.aiAnalysis || 'Not specified'}
- Red Flags: ${assessment?.redFlags?.join(', ') || 'None identified'}

PLAN:
- Recommendations: ${plan?.recommendations?.join('; ') || 'Not specified'}
- Tests Needed: ${plan?.testsNeeded?.join(', ') || 'None'}
- Specialist Referral: ${plan?.specialistReferral || 'None'}
- Follow-up Needed: ${plan?.followUpNeeded ? 'Yes' : 'No'}
- Urgency: ${plan?.urgency || 'Standard'}

Department: ${report.department || 'General Medicine'}
Report Status: ${report.reviewStatus}
`;

    // Build chat history context
    const chatHistoryText = chatHistory
      .slice(-6)
      .map(
        (msg: any) => `${msg.role === 'user' ? 'Doctor' : 'AI'}: ${msg.content}`
      )
      .join('\n');

    // Create prompt
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a medical AI assistant helping a doctor understand a clinical SOAP report.
You have access to the complete patient report and should answer questions accurately based on the data.
Be professional, concise, and clinically relevant.
If information is not available in the report, say so clearly.
Do NOT make up medical information not present in the report.

REPORT DATA:
${reportContext}

${chatHistoryText ? `PREVIOUS CONVERSATION:\n${chatHistoryText}` : ''}`,
      ],
      ['human', '{question}'],
    ]);

    const chain = prompt.pipe(groqLLM).pipe(new StringOutputParser());
    const response = await chain.invoke({ question });

    return NextResponse.json({
      success: true,
      response: response.trim(),
      reportId: id,
    });
  } catch (error) {
    console.error('Error in chat with report:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}

/**
 * PDF Generator for Clinical Reports
 * Generates SOAP Reports and Prescription PDFs with project theme
 */

import { jsPDF } from 'jspdf';
import type { SOAPReport } from './agents/types';

// Project theme colors
const THEME = {
  primary: '#1e3b70',
  secondary: '#3e6fcb',
  accent: '#5a8dee',
  lightBg: '#f8fafc',
  text: '#1f2937',
  muted: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

interface SOAPReportPDFData {
  report: SOAPReport;
  patientInfo?: {
    name: string;
    age?: number;
    gender?: string;
    mrn?: string;
    bloodGroup?: string;
  };
  medicalHistory?: {
    chronicConditions?: string[];
    currentMedications?: string[];
    allergies?: string[];
    familyHistory?: Record<string, boolean>;
  };
  sessionDate: string;
}

interface PrescriptionPDFData {
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  diagnosis: string;
  prescription: string;
  doctorName: string;
  doctorSpecialization?: string;
  doctorLicense?: string;
  doctorHospital?: string;
  doctorPhone?: string;
  doctorEmail?: string;
  includeDockerDetails: boolean;
  date: string;
}

/**
 * Generate SOAP Report PDF
 */
export function generateSOAPReportPDF(data: SOAPReportPDFData): Uint8Array {
  const { report, patientInfo, medicalHistory, sessionDate } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper functions
  const addText = (
    text: string,
    x: number,
    y: number,
    options?: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      color?: string;
      maxWidth?: number;
    }
  ) => {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      color = THEME.text,
      maxWidth,
    } = options || {};
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color);

    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.35);
    }
    doc.text(text, x, y);
    return fontSize * 0.35;
  };

  const addLine = (y: number, color: string = THEME.muted) => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const addSection = (title: string, letter: string, bgColor: string) => {
    // Section header
    doc.setFillColor(bgColor);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');

    // Letter badge
    doc.setFillColor(THEME.primary);
    doc.circle(margin + 7, yPos + 5, 4, 'F');
    doc.setTextColor('#ffffff');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(letter, margin + 7, yPos + 6.5, { align: 'center' });

    // Title
    doc.setTextColor(THEME.text);
    doc.setFontSize(12);
    doc.text(title, margin + 15, yPos + 6);

    yPos += 14;
  };

  // ==================== HEADER ====================
  // Logo background
  doc.setFillColor(THEME.primary);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Header text
  doc.setTextColor('#ffffff');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SEHAT GUFTAGU', margin, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Clinical Narrative Report', margin, 22);

  // Report metadata
  doc.setFontSize(8);
  doc.text(
    `Report ID: ${report.metadata.sessionId.slice(0, 12)}...`,
    pageWidth - margin,
    12,
    { align: 'right' }
  );
  doc.text(
    `Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}`,
    pageWidth - margin,
    18,
    { align: 'right' }
  );
  doc.text(
    `Department: ${report.metadata.department || 'General Medicine'}`,
    pageWidth - margin,
    24,
    { align: 'right' }
  );

  yPos = 42;

  // ==================== PATIENT DEMOGRAPHICS ====================
  doc.setFillColor(THEME.lightBg);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 2, 2, 'F');

  addText('PATIENT INFORMATION', margin + 3, yPos + 6, {
    fontSize: 9,
    fontStyle: 'bold',
    color: THEME.muted,
  });

  const col1 = margin + 3;
  const col2 = pageWidth / 2;

  addText(
    `Patient Name: ${patientInfo?.name || 'Not provided'}`,
    col1,
    yPos + 13,
    { fontSize: 11, fontStyle: 'bold' }
  );
  addText(`MRN: ${patientInfo?.mrn || 'N/A'}`, col2, yPos + 13, {
    fontSize: 10,
  });

  addText(`Age: ${patientInfo?.age || 'N/A'} years`, col1, yPos + 20, {
    fontSize: 10,
  });
  addText(`Gender: ${patientInfo?.gender || 'N/A'}`, col1 + 45, yPos + 20, {
    fontSize: 10,
  });
  addText(`Blood Group: ${patientInfo?.bloodGroup || 'N/A'}`, col2, yPos + 20, {
    fontSize: 10,
  });
  addText(`Date of Service: ${sessionDate}`, col2 + 45, yPos + 20, {
    fontSize: 10,
  });

  yPos += 35;

  // ==================== TRIAGE LABEL ====================
  const triageColors: Record<string, string> = {
    emergency: THEME.danger,
    urgent: THEME.warning,
    standard: THEME.accent,
    routine: THEME.success,
  };
  const triageColor = triageColors[report.metadata.triageLabel] || THEME.accent;

  doc.setFillColor(triageColor);
  doc.roundedRect(pageWidth - margin - 35, yPos - 30, 35, 8, 2, 2, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(
    report.metadata.triageLabel.toUpperCase(),
    pageWidth - margin - 17.5,
    yPos - 25,
    { align: 'center' }
  );

  // ==================== SUBJECTIVE SECTION ====================
  addSection('SUBJECTIVE', 'S', '#dbeafe');

  addText('Chief Complaint:', margin + 3, yPos, {
    fontSize: 9,
    fontStyle: 'bold',
    color: THEME.muted,
  });
  yPos += 5;
  const ccHeight = addText(report.subjective.chiefComplaint, margin + 3, yPos, {
    fontSize: 10,
    maxWidth: pageWidth - 2 * margin - 6,
  });
  yPos += ccHeight + 5;

  if (report.subjective.patientNarrative) {
    addText('Patient Narrative:', margin + 3, yPos, {
      fontSize: 9,
      fontStyle: 'bold',
      color: THEME.muted,
    });
    yPos += 5;
    const narrativeHeight = addText(
      report.subjective.patientNarrative,
      margin + 3,
      yPos,
      { fontSize: 10, maxWidth: pageWidth - 2 * margin - 6 }
    );
    yPos += narrativeHeight + 5;
  }

  if (report.subjective.symptoms.length > 0) {
    addText('Reported Symptoms:', margin + 3, yPos, {
      fontSize: 9,
      fontStyle: 'bold',
      color: THEME.muted,
    });
    yPos += 5;
    const symptomsText = report.subjective.symptoms.join(', ');
    const symptomsHeight = addText(symptomsText, margin + 3, yPos, {
      fontSize: 10,
      maxWidth: pageWidth - 2 * margin - 6,
    });
    yPos += symptomsHeight + 5;
  }

  // Medical History
  if (medicalHistory) {
    addText('Medical History:', margin + 3, yPos, {
      fontSize: 9,
      fontStyle: 'bold',
      color: THEME.muted,
    });
    yPos += 5;

    if (medicalHistory.chronicConditions?.length) {
      addText(
        `• Chronic Conditions: ${medicalHistory.chronicConditions.join(', ')}`,
        margin + 5,
        yPos,
        { fontSize: 9 }
      );
      yPos += 5;
    }
    if (medicalHistory.currentMedications?.length) {
      addText(
        `• Current Medications: ${medicalHistory.currentMedications.join(', ')}`,
        margin + 5,
        yPos,
        { fontSize: 9 }
      );
      yPos += 5;
    }
    if (medicalHistory.allergies?.length) {
      addText(
        `• Allergies: ${medicalHistory.allergies.join(', ')}`,
        margin + 5,
        yPos,
        { fontSize: 9 }
      );
      yPos += 5;
    }
  }

  yPos += 5;

  // ==================== OBJECTIVE SECTION ====================
  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  addSection('OBJECTIVE', 'O', '#d1fae5');

  // Since we can't collect vitals, we note this
  addText('Vital Signs:', margin + 3, yPos, {
    fontSize: 9,
    fontStyle: 'bold',
    color: THEME.muted,
  });
  yPos += 5;
  addText(
    'Note: Vital signs not collected during virtual consultation. Patient should have vitals measured during in-person visit.',
    margin + 3,
    yPos,
    {
      fontSize: 9,
      fontStyle: 'italic',
      color: THEME.muted,
      maxWidth: pageWidth - 2 * margin - 6,
    }
  );
  yPos += 10;

  addText('Clinical Observations:', margin + 3, yPos, {
    fontSize: 9,
    fontStyle: 'bold',
    color: THEME.muted,
  });
  yPos += 5;

  if (report.objective.reportedSymptoms.length > 0) {
    addText(
      `• Symptoms Duration & Severity: ${report.objective.severity}`,
      margin + 5,
      yPos,
      { fontSize: 9 }
    );
    yPos += 5;
  }

  addText(
    `• AI Confidence Level: ${report.objective.confidenceLevel}%`,
    margin + 5,
    yPos,
    { fontSize: 9 }
  );
  yPos += 5;

  addText(
    `• Total Symptoms Identified: ${report.objective.reportedSymptoms.length}`,
    margin + 5,
    yPos,
    { fontSize: 9 }
  );
  yPos += 8;

  // ==================== ASSESSMENT SECTION ====================
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  addSection('ASSESSMENT', 'A', '#fef3c7');

  addText('Primary Diagnosis:', margin + 3, yPos, {
    fontSize: 9,
    fontStyle: 'bold',
    color: THEME.muted,
  });
  yPos += 5;
  addText(report.assessment.primaryDiagnosis, margin + 3, yPos, {
    fontSize: 12,
    fontStyle: 'bold',
    color: THEME.primary,
  });
  yPos += 8;

  if (report.assessment.differentialDiagnosis.length > 0) {
    addText('Differential Diagnoses:', margin + 3, yPos, {
      fontSize: 9,
      fontStyle: 'bold',
      color: THEME.muted,
    });
    yPos += 5;
    report.assessment.differentialDiagnosis.forEach((dx, i) => {
      addText(`${i + 1}. ${dx}`, margin + 5, yPos, { fontSize: 9 });
      yPos += 4;
    });
    yPos += 3;
  }

  addText(`Confidence: ${report.assessment.confidence}%`, margin + 3, yPos, {
    fontSize: 9,
  });
  addText(`Severity: ${report.assessment.severity}`, margin + 60, yPos, {
    fontSize: 9,
  });
  yPos += 6;

  if (report.assessment.aiAnalysis) {
    addText('Clinical Reasoning:', margin + 3, yPos, {
      fontSize: 9,
      fontStyle: 'bold',
      color: THEME.muted,
    });
    yPos += 5;
    const analysisHeight = addText(
      report.assessment.aiAnalysis,
      margin + 3,
      yPos,
      { fontSize: 9, maxWidth: pageWidth - 2 * margin - 6 }
    );
    yPos += analysisHeight + 5;
  }

  if (report.assessment.redFlags.length > 0) {
    addText('⚠️ Red Flags Identified:', margin + 3, yPos, {
      fontSize: 9,
      fontStyle: 'bold',
      color: THEME.danger,
    });
    yPos += 5;
    report.assessment.redFlags.forEach(flag => {
      addText(`• ${flag}`, margin + 5, yPos, {
        fontSize: 9,
        color: THEME.danger,
      });
      yPos += 4;
    });
    yPos += 3;
  }

  // ==================== PLAN SECTION ====================
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = margin;
  }

  addSection('PLAN', 'P', '#e9d5ff');

  addText('Recommendations:', margin + 3, yPos, {
    fontSize: 9,
    fontStyle: 'bold',
    color: THEME.muted,
  });
  yPos += 5;
  report.plan.recommendations.forEach((rec, i) => {
    const recHeight = addText(`${i + 1}. ${rec}`, margin + 5, yPos, {
      fontSize: 9,
      maxWidth: pageWidth - 2 * margin - 10,
    });
    yPos += recHeight + 2;
  });
  yPos += 3;

  if (report.plan.testsNeeded.length > 0) {
    addText('Recommended Tests:', margin + 3, yPos, {
      fontSize: 9,
      fontStyle: 'bold',
      color: THEME.muted,
    });
    yPos += 5;
    report.plan.testsNeeded.forEach(test => {
      addText(`• ${test}`, margin + 5, yPos, { fontSize: 9 });
      yPos += 4;
    });
    yPos += 3;
  }

  if (report.plan.specialistReferral) {
    addText('Specialist Referral:', margin + 3, yPos, {
      fontSize: 9,
      fontStyle: 'bold',
      color: THEME.muted,
    });
    yPos += 5;
    addText(report.plan.specialistReferral, margin + 5, yPos, { fontSize: 9 });
    yPos += 6;
  }

  addText(
    `Follow-up Required: ${report.plan.followUpNeeded ? 'Yes' : 'No'}`,
    margin + 3,
    yPos,
    { fontSize: 9 }
  );
  addText(`Urgency: ${report.plan.urgency}`, margin + 60, yPos, {
    fontSize: 9,
  });

  // ==================== FOOTER ====================
  const footerY = pageHeight - 15;
  addLine(footerY - 5, THEME.muted);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(THEME.muted);
  doc.text(
    'This report was generated by Sehat Guftagu AI Clinical Assistant. It is intended for informational purposes only and',
    margin,
    footerY
  );
  doc.text(
    'should not replace professional medical advice, diagnosis, or treatment. Please consult with a qualified healthcare provider.',
    margin,
    footerY + 3
  );
  doc.text(
    `AI Version: ${report.metadata.aiVersion}`,
    pageWidth - margin,
    footerY + 3,
    { align: 'right' }
  );

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

/**
 * Generate Prescription PDF
 */
export function generatePrescriptionPDF(data: PrescriptionPDFData): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // ==================== HEADER ====================
  doc.setFillColor(THEME.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo and clinic name
  doc.setTextColor('#ffffff');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SEHAT GUFTAGU', margin, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Assisted Medical Prescription', margin, 26);

  // Date
  doc.setFontSize(9);
  doc.text(`Date: ${data.date}`, pageWidth - margin, 18, { align: 'right' });

  yPos = 50;

  // ==================== DOCTOR INFORMATION (if included) ====================
  if (data.includeDockerDetails) {
    doc.setFillColor(THEME.lightBg);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 2, 2, 'F');

    doc.setTextColor(THEME.muted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESCRIBING PHYSICIAN', margin + 3, yPos + 6);

    doc.setTextColor(THEME.text);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dr. ${data.doctorName}`, margin + 3, yPos + 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (data.doctorSpecialization) {
      doc.text(data.doctorSpecialization, margin + 3, yPos + 20);
    }
    if (data.doctorLicense) {
      doc.text(`License: ${data.doctorLicense}`, margin + 3, yPos + 26);
    }

    // Right column
    const col2 = pageWidth / 2 + 10;
    if (data.doctorHospital) {
      doc.text(data.doctorHospital, col2, yPos + 14);
    }
    if (data.doctorPhone) {
      doc.text(`Tel: ${data.doctorPhone}`, col2, yPos + 20);
    }
    if (data.doctorEmail) {
      doc.text(`Email: ${data.doctorEmail}`, col2, yPos + 26);
    }

    yPos += 38;
  }

  // ==================== PATIENT INFORMATION ====================
  doc.setDrawColor(THEME.secondary);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  doc.setTextColor(THEME.muted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT DETAILS', margin, yPos + 4);
  yPos += 8;

  doc.setTextColor(THEME.text);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Name: ${data.patientName}`, margin, yPos + 4);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const patientDetails = [];
  if (data.patientAge) patientDetails.push(`Age: ${data.patientAge} years`);
  if (data.patientGender) patientDetails.push(`Gender: ${data.patientGender}`);
  doc.text(patientDetails.join('  |  '), margin, yPos + 10);

  yPos += 18;

  // ==================== DIAGNOSIS ====================
  doc.setDrawColor(THEME.secondary);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  doc.setTextColor(THEME.muted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DIAGNOSIS', margin, yPos + 4);
  yPos += 8;

  doc.setTextColor(THEME.primary);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const diagLines = doc.splitTextToSize(data.diagnosis, pageWidth - 2 * margin);
  doc.text(diagLines, margin, yPos + 4);
  yPos += diagLines.length * 5 + 8;

  // ==================== PRESCRIPTION ====================
  doc.setDrawColor(THEME.secondary);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Rx Symbol
  doc.setFillColor(THEME.secondary);
  doc.circle(margin + 8, yPos + 8, 6, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Rx', margin + 8, yPos + 10, { align: 'center' });

  doc.setTextColor(THEME.muted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESCRIPTION', margin + 18, yPos + 4);
  yPos += 14;

  doc.setTextColor(THEME.text);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Parse and format prescription
  const prescriptionLines = data.prescription.split('\n');
  prescriptionLines.forEach(line => {
    if (line.trim()) {
      const textLines = doc.splitTextToSize(line, pageWidth - 2 * margin - 10);
      doc.text(textLines, margin + 5, yPos);
      yPos += textLines.length * 5 + 3;
    }
  });

  // ==================== FOOTER ====================
  const footerY = pageHeight - 35;

  // Signature line
  doc.setDrawColor(THEME.text);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 60, footerY, pageWidth - margin, footerY);

  doc.setTextColor(THEME.muted);
  doc.setFontSize(8);
  doc.text("Doctor's Signature", pageWidth - margin - 30, footerY + 5, {
    align: 'center',
  });

  // Disclaimer
  doc.setDrawColor(THEME.muted);
  doc.line(margin, footerY + 12, pageWidth - margin, footerY + 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'This prescription was generated through Sehat Guftagu telemedicine platform. Please follow the prescribed',
    margin,
    footerY + 18
  );
  doc.text(
    'medications as directed. If you experience any adverse effects, contact your healthcare provider immediately.',
    margin,
    footerY + 22
  );

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

/**
 * Convert PDF bytes to base64 for storage
 */
export function pdfToBase64(pdfBytes: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(pdfBytes);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 back to PDF bytes
 */
export function base64ToPdf(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

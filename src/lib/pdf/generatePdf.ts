import { jsPDF } from 'jspdf';
import { getRiskBand } from '@/lib/config';
import { METFORMIN_LABELS, DISCHARGE_LABELS } from '@/lib/model/encodings';
import { computeBMI } from '@/lib/clinical/bmi';
import { classifyBloodPressure } from '@/lib/clinical/bloodPressure';
import modelParams from '@/lib/model/model_params.json';

interface PdfData {
  inputs: Record<string, number>;
  formAnswers: Record<string, number>;
  score: number; z: number;
  contributions: { feature: string; contribution: number }[];
  clinicalContext?: { height: number; weight: number; systolic?: number; diastolic?: number };
  timestamp: string;
}

const FL: Record<string, string> = {
  number_inpatient:'Prior inpatient stays',number_emergency:'Emergency visits',
  number_diagnoses:'Diagnoses recorded',num_medications:'Medications',
  num_lab_procedures:'Lab procedures',num_procedures:'Other procedures',
  diabetesMed:'Diabetes medication',metformin:'Metformin',
  diag_1_Respiratory:'Respiratory diagnosis',
  discharge_disposition_id_2:'Discharge: short-term hospital',
  discharge_disposition_id_3:'Discharge: SNF',
  discharge_disposition_id_5:'Discharge: other inpatient',
  discharge_disposition_id_6:'Discharge: home health',
  discharge_disposition_id_22:'Discharge: rehab',
};

function addSection(doc: jsPDF, title: string, y: number, margin: number): number {
  if (y > 260) { doc.addPage(); y = margin; }
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y); y += 7;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  return y;
}

export function generatePdf(data: PdfData): void {
  const doc = new jsPDF(); const m = 14; let y = m;
  const now = new Date(data.timestamp);
  const ds = now.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const ts = now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  const rs = Math.round(data.score * 100);
  const band = getRiskBand(data.score);
  const flag = data.score >= modelParams.decision_threshold;
  // Title
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Readmission Risk Assessment', m, y); y += 10;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`${ds} at ${ts}`, m, y); y += 10;

  // Score
  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(`Risk Score: ${rs} / 100  (${band} risk)`, m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  if (flag) { doc.text('Model flags: higher risk of readmission', m, y); y += 8; }
  doc.text(`Decision threshold: ${modelParams.decision_threshold}`, m, y); y += 12;

  // Answers table
  y = addSection(doc, 'Patient Answers', y, m);
  const dv = data.formAnswers.dischargeDestination ?? 0;
  const rows: [string, string][] = [
    ['Prior inpatient stays', String(data.inputs.number_inpatient)],
    ['Emergency visits', String(data.inputs.number_emergency)],
    ['Diagnoses recorded', String(data.inputs.number_diagnoses)],
    ['Medications', String(data.inputs.num_medications)],
    ['Lab procedures', String(data.inputs.num_lab_procedures)],
    ['Other procedures', String(data.inputs.num_procedures)],
    ['Diabetes medication', data.inputs.diabetesMed === 1 ? 'Yes' : 'No'],
    ['Metformin', METFORMIN_LABELS[data.inputs.metformin] || 'N/A'],
    ['Respiratory diagnosis', data.inputs.diag_1_Respiratory === 1 ? 'Yes' : 'No'],
    ['Discharge destination', DISCHARGE_LABELS[dv] || 'Home / other'],
  ];
  rows.forEach(([l, v]) => { doc.text(`${l}:`, m, y); doc.text(v, m + 60, y); y += 5; });
  y += 6;

  // Factors
  y = addSection(doc, 'Contributing Factors', y, m);
  const sorted = [...data.contributions].sort((a, b) => b.contribution - a.contribution);
  sorted.forEach(c => {
    if (y > 270) { doc.addPage(); y = m; }
    const sign = c.contribution >= 0 ? '+' : '';
    doc.text(`${FL[c.feature] || c.feature}: ${sign}${c.contribution.toFixed(4)}`, m, y); y += 5;
  });
  y += 6;

  // Clinical context
  if (data.clinicalContext) {
    const cc = data.clinicalContext;
    y = addSection(doc, 'Clinical Context', y, m);
    if (cc.height > 0 && cc.weight > 0) {
      const bmi = computeBMI(cc.height, cc.weight);
      doc.text(`BMI: ${bmi.bmi} (${bmi.category})`, m, y); y += 5;
    }
    if (cc.systolic && cc.diastolic) {
      const bp = classifyBloodPressure(cc.systolic, cc.diastolic);
      doc.text(`BP: ${cc.systolic}/${cc.diastolic} mmHg (${bp.category})`, m, y); y += 5;
    }
    doc.text('Not used in the risk score.', m, y); y += 8;
  }

  // Model info
  y = addSection(doc, 'Model Information', y, m);
  doc.text(`Trained on: ${modelParams.trained_on}`, m, y); y += 5;
  doc.text(`Test ROC-AUC: ${modelParams.test_roc_auc}`, m, y); y += 10;

  // Disclaimer
  if (y > 260) { doc.addPage(); y = m; }
  doc.setFontSize(8); doc.setFont('helvetica', 'italic');
  const disc = 'Disclaimer: This tool is for decision-support only. It uses a baseline model trained on historical US hospital data (1999-2008) and will produce many false alarms. It is not a diagnosis and does not replace clinical judgment. No patient data is stored or transmitted.';
  doc.text(doc.splitTextToSize(disc, 180), m, y);

  // Save
  const pad = (n: number) => String(n).padStart(2, '0');
  const fname = `readmission-risk-${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
  doc.save(fname);
}
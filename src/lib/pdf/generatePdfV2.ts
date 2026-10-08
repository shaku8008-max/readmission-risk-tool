import { jsPDF } from "jspdf";
import { METFORMIN_LABELS, DISCHARGE_LABELS } from "@/lib/model/encodings";
import { computeBMI } from "@/lib/clinical/bmi";
import { classifyBloodPressure } from "@/lib/clinical/bloodPressure";
import type { RiskTier } from "@/lib/tiers";

interface PdfData {
  inputs: Record<string, number>; formAnswers: Record<string, number>;
  score: number; z: number; contributions: { feature: string; contribution: number }[];
  clinicalContext?: { height: number; weight: number; systolic?: number; diastolic?: number };
  timestamp: string;
}

const FL: Record<string, string> = {
  number_inpatient:"Prior inpatient stays", number_emergency:"Emergency visits",
  number_diagnoses:"Diagnoses recorded", num_medications:"Medications",
  num_lab_procedures:"Lab procedures", num_procedures:"Other procedures",
  diabetesMed:"Diabetes medication", metformin:"Metformin",
  diag_1_Respiratory:"Respiratory diagnosis",
  discharge_disposition_id_2:"Discharge: short-term hospital", discharge_disposition_id_3:"Discharge: SNF",
  discharge_disposition_id_5:"Discharge: other inpatient", discharge_disposition_id_6:"Discharge: home health",
  discharge_disposition_id_18:"Discharge: missing", discharge_disposition_id_22:"Discharge: rehab",
};

function addSection(doc: jsPDF, title: string, y: number, m: number): number {
  if (y > 260) { doc.addPage(); y = m; }
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(title, m, y); y += 7;
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  return y;
}

export function generatePdfV2(data: PdfData, tier: RiskTier, n: number): void {
  const doc = new jsPDF(); const m = 14; let y = m;
  const now = new Date(data.timestamp);
  const ds = now.toLocaleDateString("en-US", {year:"numeric", month:"long", day:"numeric"});
  const ts = now.toLocaleTimeString("en-US", {hour:"2-digit", minute:"2-digit"});
  const rs = Math.round(data.score * 100);

  // Title
  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text("Readmission Risk Assessment — Version 2", m, y); y += 10;
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`${ds} at ${ts}`, m, y); y += 10;

  // Tier + Score
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text(`${tier.label} risk tier — Score: ${rs} / 100`, m, y); y += 8;
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`About 1 in ${n} patients in this tier were readmitted to hospital within 30 days.`, m, y); y += 8;
  if (tier.key === "low") {
    const xIn10 = Math.round(tier.share_of_all_readmissions * 10);
    doc.text(`Lower risk does not mean no risk. About ${xIn10} in 10 of all readmissions came from patients in this tier.`, m, y); y += 8;
  }
  y += 4;

  // Answers table
  y = addSection(doc, "Patient Answers", y, m);
  const dv = data.formAnswers.dischargeDestination ?? 0;
  const rows: [string, string][] = [
    ["Prior inpatient stays", String(data.inputs.number_inpatient)],
    ["Emergency visits", String(data.inputs.number_emergency)],
    ["Diagnoses recorded", String(data.inputs.number_diagnoses)],
    ["Medications", String(data.inputs.num_medications)],
    ["Lab procedures", String(data.inputs.num_lab_procedures)],
    ["Other procedures", String(data.inputs.num_procedures)],
    ["Diabetes medication", data.inputs.diabetesMed === 1 ? "Yes" : "No"],
    ["Metformin", METFORMIN_LABELS[data.inputs.metformin] || "N/A"],
    ["Respiratory diagnosis", data.inputs.diag_1_Respiratory === 1 ? "Yes" : "No"],
    ["Discharge destination", DISCHARGE_LABELS[dv] || "Home / other"],
  ];
  rows.forEach(([l, v]) => { doc.text(`${l}:`, m, y); doc.text(v, m + 60, y); y += 5; });
  y += 6;

  // Factors
  y = addSection(doc, "Contributing Factors", y, m);
  const sorted = [...data.contributions].sort((a, b) => b.contribution - a.contribution);
  sorted.forEach(c => {
    if (y > 270) { doc.addPage(); y = m; }
    const sign = c.contribution >= 0 ? "+" : "";
    doc.text(`${FL[c.feature] || c.feature}: ${sign}${c.contribution.toFixed(4)}`, m, y); y += 5;
  });
  y += 6;

  // Clinical context
  if (data.clinicalContext) {
    const cc = data.clinicalContext;
    y = addSection(doc, "Clinical Context", y, m);
    if (cc.height > 0 && cc.weight > 0) {
      const bmi = computeBMI(cc.height, cc.weight);
      doc.text(`BMI: ${bmi.bmi} (${bmi.category})`, m, y); y += 5;
    }
    if (cc.systolic && cc.diastolic) {
      const bp = classifyBloodPressure(cc.systolic, cc.diastolic);
      doc.text(`BP: ${cc.systolic}/${cc.diastolic} mmHg (${bp.category})`, m, y); y += 5;
    }
    doc.text("Not used in the risk score.", m, y); y += 8;
  }

  // Limitations
  y = addSection(doc, "Limitations", y, m);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  const lims = [
    "Based on US hospital records from 1999 to 2008 for patients with diabetes; not checked against local patients.",
    "Not a validated clinical tool and not a substitute for clinical judgement.",
    "Patients aged 80 and over are placed in the Moderate tier more often than their actual readmission rate justifies.",
    "Results are less certain for smaller racial and ethnic groups, which had few patients in the test data.",
  ];
  lims.forEach(l => { if (y > 270) { doc.addPage(); y = m; } doc.text(`• ${l}`, m, y, { maxWidth: 180 }); y += 8; });

  // Disclaimer
  if (y > 260) { doc.addPage(); y = m; }
  doc.setFontSize(8); doc.setFont("helvetica", "italic");
  doc.text(doc.splitTextToSize("Disclaimer: This tool is for decision-support only. It is not a diagnosis and does not replace clinical judgment. No patient data is stored or transmitted.", 180), m, y);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fname = `readmission-risk-v2-${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
  doc.save(fname);
}

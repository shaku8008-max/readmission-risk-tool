'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { computeBMI } from '@/lib/clinical/bmi';
import { classifyBloodPressure } from '@/lib/clinical/bloodPressure';
import { getRiskBand, getRiskBandColor, FACTOR_THRESHOLDS } from '@/lib/config';
import { METFORMIN_LABELS, DISCHARGE_LABELS } from '@/lib/model/encodings';
import modelParams from '@/lib/model/model_params.json';
import { generatePdf } from '@/lib/pdf/generatePdf';

const { display_stats, decision_threshold } = modelParams;

interface StoredResult {
  inputs: Record<string, number>;
  formAnswers: Record<string, number>;
  score: number; z: number;
  contributions: { feature: string; contribution: number }[];
  clinicalContext?: { height: number; weight: number; systolic?: number; diastolic?: number };
  timestamp: string;
}

interface GroupedFactor {
  label: string; contribution: number;
  patientValue: string; typicalValue: string;
}

function getDisplayVal(feature: string, val: number): string {
  if (feature === 'diabetesMed') return val === 1 ? 'Yes' : 'No';
  if (feature === 'metformin') return METFORMIN_LABELS[val] || String(val);
  if (feature === 'diag_1_Respiratory') return val === 1 ? 'Yes' : 'No';
  if (feature.startsWith('discharge_disposition_id_')) {
    const id = Number(feature.split('_').pop());
    return val === 1 ? (DISCHARGE_LABELS[id] || String(id)) : '—';
  }
  return String(val);
}

function getTypicalVal(feature: string): string {
  const s = display_stats[feature as keyof typeof display_stats];
  if (!s) return '—';
  if ('share_yes' in s) { const sy = s as { share_yes: number }; return sy.share_yes >= 0.5 ? 'Yes' : 'No'; }
  if ('median' in s) { const m = s as { median: number }; return String(m.median); }
  return '—';
}
function groupContributions(stored: StoredResult): GroupedFactor[] {
  const { contributions, inputs } = stored;
  // Group discharge features together
  const dischargeFeatures = ['discharge_disposition_id_2','discharge_disposition_id_3','discharge_disposition_id_5','discharge_disposition_id_6','discharge_disposition_id_11','discharge_disposition_id_18','discharge_disposition_id_22'];
  const dischargeContrib = contributions.filter(c => dischargeFeatures.includes(c.feature)).reduce((s, c) => s + c.contribution, 0);
  const dischargeVal = dischargeFeatures.some(f => inputs[f] === 1) ? dischargeFeatures.find(f => inputs[f] === 1) || '' : '';
  const dischargePatient = dischargeVal ? getDisplayVal(dischargeVal, 1) : 'Home / other';
  const otherContribs = contributions.filter(c => !dischargeFeatures.includes(c.feature));
  const groups: GroupedFactor[] = otherContribs.map(c => ({
    label: getFeatureLabel(c.feature),
    contribution: c.contribution,
    patientValue: getDisplayVal(c.feature, inputs[c.feature]),
    typicalValue: getTypicalVal(c.feature),
  }));
  groups.push({
    label: 'Discharge destination',
    contribution: dischargeContrib,
    patientValue: dischargePatient,
    typicalValue: 'Home / other',
  });
  return groups;
}

function getFeatureLabel(f: string): string {
  const labels: Record<string, string> = {
    number_inpatient: 'Prior inpatient stays',
    number_emergency: 'Emergency visits',
    number_diagnoses: 'Diagnoses recorded',
    num_medications: 'Medications',
    num_lab_procedures: 'Lab procedures',
    num_procedures: 'Other procedures',
    diabetesMed: 'Diabetes medication',
    metformin: 'Metformin',
    diag_1_Respiratory: 'Respiratory diagnosis',
  };
  return labels[f] || f;
}

function generateSummary(score: number, band: string, raising: GroupedFactor[], lowering: GroupedFactor[]): string {
  const pct = Math.round(score * 100);
  let s = `This patient's risk score is ${pct} out of 100, which falls in the ${band} risk band.`;
  if (raising.length > 0) {
    s += ` The main factors raising risk are: ${raising.map(r => r.label).join(', ')}.`;
  }
  if (lowering.length > 0) {
    s += ` Factors lowering risk include: ${lowering.map(r => r.label).join(', ')}.`;
  }
  s += ' This is a decision-support tool only and does not replace clinical judgment.';
  return s;
}
export default function ResultsPage() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem('readmissionResult');
    if (!raw) { router.replace('/calculator'); return; }
    try { setStored(JSON.parse(raw)); } catch { router.replace('/calculator'); }
    setLoading(false);
  }, [router]);

  if (loading || !stored) return <div className='flex justify-center py-20'><p className='text-slate-500'>Loading results...</p></div>;

  const { score, contributions, clinicalContext, timestamp } = stored;
  const riskScore = Math.round(score * 100);
  const band = getRiskBand(score);
  const bandColor = getRiskBandColor(band);
  const flagged = score >= decision_threshold;
  const groups = groupContributions(stored);
  const raising = groups.filter(g => g.contribution >= FACTOR_THRESHOLDS.RAISING_THRESHOLD).sort((a, b) => b.contribution - a.contribution).slice(0, FACTOR_THRESHOLDS.MAX_RAISING_FACTORS);
  const lowering = groups.filter(g => g.contribution <= FACTOR_THRESHOLDS.LOWERING_THRESHOLD).sort((a, b) => a.contribution - b.contribution);
  const minor = groups.filter(g => g.contribution > FACTOR_THRESHOLDS.LOWERING_THRESHOLD && g.contribution < FACTOR_THRESHOLDS.RAISING_THRESHOLD);
  const summary = generateSummary(score, band, raising, lowering);
  const maxAbs = Math.max(...groups.map(g => Math.abs(g.contribution)), 0.01);
  return (
    <div className='max-w-3xl mx-auto px-4 sm:px-6 py-8'>
      <h1 className='text-2xl font-bold text-slate-900 mb-8'>Risk Assessment Results</h1>

      {/* Section 1: Risk Score */}
      <section className='bg-white rounded-xl p-8 border border-slate-200 shadow-sm mb-8 text-center'>
        <p className='text-sm font-medium text-slate-500 mb-2'>Risk score</p>
        <p className='text-6xl font-bold text-slate-900 mb-2'>{riskScore} <span className='text-3xl text-slate-400'>/ 100</span></p>
        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${bandColor}`}>{band} risk</span>
        {flagged && <p className='mt-4 text-sm font-medium text-red-700 bg-red-50 inline-block px-3 py-1 rounded-lg'>Model flags: higher risk of readmission</p>}
      </section>

      {/* Section 2: Why */}
      <section className='bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8'>
        <h2 className='text-lg font-semibold text-slate-900 mb-2'>Why the model scored this patient this way</h2>
        <p className='text-sm text-slate-500 mb-6'>Contributions are relative to an average patient in the training data.</p>
        {raising.length > 0 && (
          <div className='mb-6'>
            <h3 className='text-sm font-semibold text-red-700 mb-3'>Raising risk (danger zone)</h3>
            {raising.map(g => (
              <div key={g.label} className='mb-3'>
                <div className='flex justify-between text-sm mb-1'><span className='font-medium text-slate-700'>{g.label}: {g.patientValue} <span className='text-slate-400'>(typical {g.typicalValue})</span></span><span className='text-red-600 font-medium'>+{g.contribution.toFixed(3)}</span></div>
                <div className='w-full bg-slate-100 rounded-full h-2'><div className='bg-red-500 h-2 rounded-full' style={{width: `${Math.min(100, (Math.abs(g.contribution)/maxAbs)*100)}%`}}/></div>
              </div>
            ))}
          </div>
        )}
        {lowering.length > 0 && (
          <div className='mb-6'>
            <h3 className='text-sm font-semibold text-green-700 mb-3'>Lowering risk</h3>
            {lowering.map(g => (
              <div key={g.label} className='mb-3'>
                <div className='flex justify-between text-sm mb-1'><span className='font-medium text-slate-700'>{g.label}: {g.patientValue} <span className='text-slate-400'>(typical {g.typicalValue})</span></span><span className='text-green-600 font-medium'>{g.contribution.toFixed(3)}</span></div>
                <div className='w-full bg-slate-100 rounded-full h-2'><div className='bg-green-500 h-2 rounded-full' style={{width: `${Math.min(100, (Math.abs(g.contribution)/maxAbs)*100)}%`}}/></div>
              </div>
            ))}
          </div>
        )}
        {minor.length > 0 && (
          <details className='mt-4'>
            <summary className='text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-700'>Minor factors ({minor.length})</summary>
            <div className='mt-2 space-y-1'>
              {minor.map(g => (
                <div key={g.label} className='flex justify-between text-xs text-slate-500'><span>{g.label}: {g.patientValue}</span><span>{g.contribution >= 0 ? '+' : ''}{g.contribution.toFixed(3)}</span></div>
              ))}
            </div>
          </details>
        )}
      </section>

      {/* Section 3: Clinical context */}
      {clinicalContext && (
        <section className='bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8'>
          <h2 className='text-lg font-semibold text-slate-900 mb-4'>Clinical context</h2>
          <p className='text-xs text-slate-500 mb-4 italic'>Not used in the risk score</p>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {clinicalContext.height > 0 && clinicalContext.weight > 0 && (() => {
              const bmi = computeBMI(clinicalContext.height, clinicalContext.weight);
              return (
                <div className='bg-slate-50 rounded-lg p-4 border border-slate-100'>
                  <p className='text-sm font-medium text-slate-700'>BMI</p>
                  <p className='text-2xl font-bold text-slate-900'>{bmi.bmi}</p>
                  <p className='text-sm text-slate-600'>{bmi.category}</p>
                  <p className='text-xs text-slate-400 mt-1'>Not used in the risk score</p>
                </div>
              );
            })()}
            {clinicalContext.systolic && clinicalContext.diastolic && (() => {
              const bp = classifyBloodPressure(clinicalContext.systolic, clinicalContext.diastolic);
              return (
                <div className='bg-slate-50 rounded-lg p-4 border border-slate-100'>
                  <p className='text-sm font-medium text-slate-700'>Blood Pressure</p>
                  <p className='text-2xl font-bold text-slate-900'>{clinicalContext.systolic}/{clinicalContext.diastolic}</p>
                  <p className='text-sm text-slate-600'>{bp.category}</p>
                  <p className='text-xs text-slate-400 mt-1'>Not used in the risk score</p>
                </div>
              );
            })()}
          </div>
        </section>
      )}
      {/* Section 4: Summary */}
      <section className='bg-blue-50 rounded-xl p-6 sm:p-8 border border-blue-100 mb-8'>
        <h2 className='text-lg font-semibold text-blue-900 mb-3'>Summary</h2>
        <p className='text-sm text-blue-800 leading-relaxed'>{summary}</p>
      </section>

      {/* Section 5: Buttons */}
      <div className='flex flex-col sm:flex-row gap-3 mb-8'>
        <button onClick={() => generatePdf(stored)} className='px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors text-sm'>Download results (PDF)</button>
        <Link href='/calculator' onClick={() => sessionStorage.removeItem('readmissionResult')} className='px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors text-sm text-center'>New assessment</Link>
      </div>

      {/* Section 6: Disclaimer */}
      <section className='bg-slate-50 rounded-xl p-6 border border-slate-200'>
        <p className='text-xs text-slate-500 leading-relaxed'><strong>Disclaimer:</strong> This tool is for decision-support only. It uses a baseline model trained on historical US hospital data (1999-2008) and will produce many false alarms. It is not a diagnosis and does not replace clinical judgment. No patient data is stored or transmitted.</p>
      </section>
    </div>
  );
}

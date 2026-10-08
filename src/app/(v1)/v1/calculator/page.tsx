'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import modelParams from '@/lib/model/model_params.v1.json';
import { predictReadmission } from '@/lib/model/predict';
import type { PredictionInput } from '@/lib/model/predict';
import { dischargeToOneHot } from '@/lib/model/encodings';
import ProgressBar from '@/components/ProgressBar';
import InfoButton from '@/components/InfoButton';
import { CalculatorStep } from './CalculatorStep';
const { feature_ranges, display_stats } = modelParams;

export function getTypicalText(f:string):string{
  const s=display_stats[f as keyof typeof display_stats];
  if(!s||!('median' in s))return'';
  const m=s as{median:number;p25?:number;p75?:number};
  return m.p25!==undefined&&m.p75!==undefined&&m.p25!==m.p75
    ?`Typical: ${m.median} (most patients ${m.p25}-${m.p75})`
    :`Typical: ${m.median}`;
}
export function getYesNoText(f:string):string{
  const s=display_stats[f as keyof typeof display_stats];
  if(!s||!('share_yes' in s))return'';
  const m=s as{share_yes:number};
  return m.share_yes>=0.5?'Most patients: Yes':'Most patients: No';
}
export interface FormData{number_inpatient:string;number_emergency:string;number_diagnoses:string;num_medications:string;num_lab_procedures:string;num_procedures:string;diabetesMed:string;metformin:string;diag_1_Respiratory:string;dischargeDestination:string;height:string;weight:string;systolic:string;diastolic:string;}
const IF:FormData={number_inpatient:'',number_emergency:'',number_diagnoses:'',num_medications:'',num_lab_procedures:'',num_procedures:'',diabetesMed:'',metformin:'',diag_1_Respiratory:'',dischargeDestination:'0',height:'',weight:'',systolic:'',diastolic:''};
const T=9;
const INFO:Record<number,{title:string;info:string}>={
  1:{title:'Prior inpatient stays in the past year',info:'Past admissions were the strongest signal in the model. In the training data, patients with more recent inpatient stays were more likely to be readmitted.'},
  2:{title:'Emergency visits in the past year',info:'More emergency visits were associated with a higher readmission risk in the training data (a smaller effect than inpatient stays).'},
  3:{title:'Number of diagnoses recorded',info:'More recorded diagnoses indicates a more complex clinical picture, and was associated with higher risk.'},
  4:{title:'Number of distinct medications given this stay',info:'A larger medication count is a proxy for complexity of care and was associated with higher risk.'},
  5:{title:'Tests and procedures this stay',info:'These reflect how intensively the patient was assessed and treated. In the data, more lab tests were linked to slightly higher risk and more procedures to slightly lower risk. Do not read these as cause and effect.'},
  6:{title:'Diabetes medication',info:'Diabetes medication status and metformin changes were small but consistent signals in the model.'},
  7:{title:'Primary diagnosis is respiratory',info:'In the training data a respiratory primary diagnosis was associated with a slightly lower score than other diagnoses.'},
  8:{title:'Discharge destination',info:'Where the patient goes after discharge was a major signal; transfers to nursing or rehab facilities were associated with higher risk.'},
  9:{title:'Clinical context (Optional)',info:'These measurements are for additional clinical context only and are NOT used in the risk score calculation.'},
};
function validate(s:number,f:FormData):string|null{
  const ok=(v:string)=>v.trim()!==''&&!isNaN(Number(v))&&Number.isInteger(Number(v));
  const chk=(v:string,r:{min:number;max:number})=>{const n=Number(v);return n<r.min||n>r.max?`Must be between ${r.min} and ${r.max}.`:null};
  switch(s){
    case 1:return!ok(f.number_inpatient)?'Please enter a whole number.':chk(f.number_inpatient,feature_ranges.number_inpatient);
    case 2:return!ok(f.number_emergency)?'Please enter a whole number.':chk(f.number_emergency,feature_ranges.number_emergency);
    case 3:return!ok(f.number_diagnoses)?'Please enter a whole number.':chk(f.number_diagnoses,feature_ranges.number_diagnoses);
    case 4:return!ok(f.num_medications)?'Please enter a whole number.':chk(f.num_medications,feature_ranges.num_medications);
    case 5:{if(!ok(f.num_lab_procedures))return'Please enter a whole number for lab procedures.';
      const e1=chk(f.num_lab_procedures,feature_ranges.num_lab_procedures);if(e1)return'Lab procedures '+e1;
      if(!ok(f.num_procedures))return'Please enter a whole number for procedures.';
      const e2=chk(f.num_procedures,feature_ranges.num_procedures);return e2?'Procedures '+e2:null;}
    case 6:return f.diabetesMed===''?'Please select an option.':(f.diabetesMed==='1'&&f.metformin===''?'Please select a metformin option.':null);
    case 7:return f.diag_1_Respiratory===''?'Please select an option.':null;
    default:return null;
  }
}
export default function CalculatorPage(){
  const router=useRouter();
  const[step,setStep]=useState(1);
  const[form,setForm]=useState<FormData>(IF);
  const[err,setErr]=useState<string|null>(null);
  const upd=useCallback((f:keyof FormData,v:string)=>{setForm(p=>({...p,[f]:v}));setErr(null)},[]);
  const submit=useCallback(()=>{
    const dv=Number(form.dischargeDestination);
    const dh=dischargeToOneHot(dv);
    const dm=form.diabetesMed==='1'?1:0;
    const mf=dm?Number(form.metformin||'0'):0;
    const inp:PredictionInput={
      number_inpatient:Number(form.number_inpatient),number_emergency:Number(form.number_emergency),
      number_diagnoses:Number(form.number_diagnoses),num_medications:Number(form.num_medications),
      num_lab_procedures:Number(form.num_lab_procedures),num_procedures:Number(form.num_procedures),
      diabetesMed:dm,metformin:mf,diag_1_Respiratory:form.diag_1_Respiratory==='1'?1:0,...dh
    } as PredictionInput;
    const res=predictReadmission(inp);
    let cc=undefined;
    if(form.height&&form.weight){
      cc={height:Number(form.height),weight:Number(form.weight),
        systolic:form.systolic?Number(form.systolic):undefined,
        diastolic:form.diastolic?Number(form.diastolic):undefined};
    }
    sessionStorage.setItem('readmissionResult',JSON.stringify({
      inputs:inp,formAnswers:{...inp,dischargeDestination:dv},
      score:res.score,z:res.z,contributions:res.contributions,
      clinicalContext:cc,timestamp:new Date().toISOString()}));
    router.push('/v1/results');
  },[form,router]);
  const next=useCallback(()=>{
    const e=validate(step,form);if(e){setErr(e);return}
    if(step===T)submit();else{setStep(s=>s+1);setErr(null)}
  },[step,form,submit]);
  const back=useCallback(()=>{setStep(s=>Math.max(1,s-1));setErr(null)},[]);
  const skip=useCallback(()=>submit(),[submit]);
  const kd=useCallback((e:React.KeyboardEvent)=>{if(e.key==='Enter'){e.preventDefault();next()}},[next]);
  return(
    <div className='max-w-2xl mx-auto px-4 sm:px-6 py-8'>
      <h1 className='text-2xl font-bold text-slate-900 mb-6'>Readmission Risk Assessment</h1>
      <ProgressBar currentStep={step} totalSteps={T}/>
      <div className='mt-8 bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm' onKeyDown={kd}>
        <h2 className='text-lg font-semibold text-slate-900 mb-1'>Step {step}: {INFO[step]?.title}</h2>
        <InfoButton text={INFO[step]?.info||''}/>
        <div className='mt-6'><CalculatorStep step={step} form={form} updateField={upd}/></div>
        {err&&<div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700' role='alert'>{err}</div>}
        <div className='mt-8 flex items-center justify-between gap-4'>
          <button type='button' onClick={back} disabled={step===1} className='px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'>Back</button>
          <div className='flex gap-3'>
            {step===9&&<button type='button' onClick={skip} className='px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors'>Skip</button>}
            <button type='button' onClick={next} className='px-6 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors'>{step===T?'Calculate risk score':'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

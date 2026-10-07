import Link from 'next/link';
import modelParams from '@/lib/model/model_params.json';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          Patient Readmission Risk Tool
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          A clinical decision-support tool that estimates the risk of hospital readmission for patients
          with diabetes, based on a logistic regression model trained on historical US hospital data.
        </p>
        <Link
          href="/calculator"
          className="inline-flex items-center px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
        >
          Start assessment
          <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-slate-900 mb-8 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Answer 8 short questions',
              desc: 'Enter basic clinical information about the patient\'s stay — prior admissions, medications, diagnoses, and discharge plan.',
            },
            {
              step: '2',
              title: 'Get a risk score',
              desc: 'The model computes a risk score from 0 to 100 based on a logistic regression formula using 16 clinical features.',
            },
            {
              step: '3',
              title: 'See contributing factors',
              desc: 'The results page shows which factors raised or lowered the score, compared to an average patient in the training data.',
            },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About the model */}
      <section className="mb-16 bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">About the model</h2>
        <div className="text-slate-600 space-y-3">
          <p>
            This model was trained on the <strong>UCI Diabetes 130-US Hospitals dataset</strong> ({modelParams.trained_on}).
            It is a simple logistic regression using {modelParams.features.length} clinical inputs, presented to
            the nurse as 8 questions.
          </p>
          <p><strong>Performance on held-out test data:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>ROC-AUC: ~{modelParams.test_roc_auc}</li>
            <li>On the readmitted class: recall ~0.55, precision ~0.19</li>
            <li>This means the model will produce <strong>many false alarms</strong> — it flags more patients than will actually be readmitted.</li>
          </ul>
        </div>
      </section>

      {/* What this tool is not */}
      <section className="bg-amber-50 rounded-xl p-8 border border-amber-200">
        <h2 className="text-2xl font-semibold text-amber-900 mb-4">What this tool is not</h2>
        <ul className="space-y-3 text-amber-800">
          <li className="flex items-start">
            <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
            <span>Not a diagnosis — the risk score is a screening aid, not a clinical conclusion.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
            <span>Not validated for current clinical practice — the training data is from 1999-2008 US hospitals.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
            <span>Not validated for populations outside the original training cohort.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
            <span>Does not replace clinical judgment — always use your professional assessment.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-600 mr-2 mt-0.5">⚠</span>
            <span>Nothing is stored — no patient identifiers are collected or transmitted.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

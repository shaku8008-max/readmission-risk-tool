export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          <strong>Disclaimer:</strong> This tool is for decision-support only. It uses a baseline model trained on
          historical US hospital data (1999-2008) and will produce many false alarms. It is not a diagnosis
          and does not replace clinical judgment. No patient data is stored or transmitted.
        </p>
      </div>
    </footer>
  );
}
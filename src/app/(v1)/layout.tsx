import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function V1Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar versionPrefix="/v1" />
      {/* Version 1 banner */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <p className="text-sm text-blue-800 text-center">
            You are using <strong>Version 1</strong>, an earlier model trained on partial data and kept for reference. <a href="/" className="underline font-medium">A newer version is available.</a>
          </p>
        </div>
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

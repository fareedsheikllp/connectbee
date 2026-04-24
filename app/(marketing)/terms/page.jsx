"use client";
import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using ConnectBeez ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. These terms apply to all users, including visitors, registered users, and others who access or use the Service in any capacity.`
  },
  {
    title: "2. Description of Service",
    content: `ConnectBeez provides a WhatsApp engagement platform that allows businesses to send campaigns, manage customer conversations, build automated chatbots, and engage with their audience via WhatsApp. The Service is provided as-is and we reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.`
  },
  {
    title: "3. Account Registration",
    content: `To use ConnectBeez, you must create an account and provide accurate, complete, and current information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use at security@ConnectBeez.io.`
  },
  {
    title: "4. Acceptable Use Policy",
    content: `You agree not to use the Service to send spam, unsolicited messages, or any content that violates WhatsApp's Business Policy or applicable laws in your jurisdiction. You must obtain proper opt-in consent from all recipients before sending them messages. You may not use the Service for illegal purposes, to harass others, or to distribute harmful content.`
  },
  {
    title: "5. WhatsApp Platform Compliance",
    content: `You acknowledge that our Service operates through WhatsApp's Business API and you must comply with WhatsApp's Business and Commerce Policies at all times. We are not responsible for any actions taken by WhatsApp against your account, including suspension or termination of WhatsApp access.`
  },
  {
    title: "6. Payment & Billing",
    content: `Paid plans are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by applicable law. We reserve the right to change pricing with 30 days written notice. Failure to pay may result in suspension or termination of your account without further liability to us.`
  },
  {
    title: "7. Data & Privacy",
    content: `Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. You retain ownership of all data you submit to the Service. By using ConnectBee, you grant us a limited, non-exclusive license to use your data solely to provide and improve the Service.`
  },
  {
    title: "8. Intellectual Property",
    content: `ConnectBeez, its logo, and all related content, features, and functionality are owned by us and protected by international copyright, trademark, patent, and other intellectual property laws. You may not copy, modify, distribute, reverse engineer, or create derivative works without explicit written permission.`
  },
  {
    title: "9. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, ConnectBeez shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or business opportunities, arising from your use of or inability to use the Service.`
  },
  {
    title: "10. Termination",
    content: `We may terminate or suspend your account at our sole discretion, without prior notice, for conduct that violates these Terms, is harmful to other users, third parties, or for any other reason we deem necessary. Upon termination, your right to use the Service will immediately cease.`
  },
  {
    title: "11. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario, Canada, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved exclusively in the courts of Ontario.`
  },
  {
    title: "12. Changes to Terms",
    content: `We reserve the right to update these Terms at any time. We will notify you of material changes via email or a prominent notice within the Service at least 14 days before they take effect. Your continued use of the Service after changes constitutes acceptance of the updated Terms.`
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        .serif { font-family: 'DM Serif Display', serif; }
        .section-card:hover { background: #f9fafb; }
      `}</style>

      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight">
            <span className="text-gray-900">Connect</span><span className="text-emerald-500">Beez</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Contact</Link>
            <Link href="/" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">← Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700 mb-8 tracking-wide uppercase">
            Legal · Terms of Service
          </div>
          <h1 className="serif text-5xl text-gray-900 mb-6 leading-tight">
            Terms of<br /><em className="text-emerald-500 not-italic">Service</em>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl">
            Please read these terms carefully before using ConnectBeez. By using our platform, you agree to be bound by the following conditions.
          </p>
          <p className="text-gray-400 text-sm mt-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Last updated February 20, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar TOC */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contents</p>
              <nav className="space-y-2">
                {sections.map((s, i) => (
                  <a
                    key={i}
                    href={`#section-${i}`}
                    className="block text-xs text-gray-400 hover:text-emerald-600 transition-colors py-0.5 leading-relaxed"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-0 divide-y divide-gray-100">
            {sections.map((section, i) => (
              <div
                key={i}
                id={`section-${i}`}
                className="section-card py-8 px-6 -mx-6 rounded-xl transition-colors cursor-default"
              >
                <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600 flex-shrink-0">
                    {i + 1}
                  </span>
                  {section.title.replace(/^\d+\.\s/, "")}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed pl-9">{section.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-20 rounded-2xl border border-gray-200 p-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gray-50">
          <div>
            <p className="font-bold text-gray-900 mb-1">Questions about our terms?</p>
            <p className="text-sm text-gray-500">Our team is happy to clarify anything.</p>
          </div>
          <Link
            href="/contact"
            className="flex-shrink-0 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
          >
            Get in touch
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© 2026 ConnectBeez. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
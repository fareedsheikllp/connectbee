"use client";
import Link from "next/link";

const sections = [
  {
    title: "Information We Collect",
    content: `We collect information you provide directly to us when you create an account, such as your name, email address, business name, and payment information. We also collect information about how you use our Service, including messages sent, contacts uploaded, and feature usage patterns. When you connect WhatsApp, we process phone numbers and message content solely to deliver the Service.`
  },
  {
    title: "How We Use Your Information",
    content: `We use the information we collect to provide, maintain, and improve our Service; process transactions and send related information; send technical notices and support messages; respond to your comments and questions; and send marketing communications with your consent. We do not sell your personal data to third parties.`
  },
  {
    title: "Information Sharing",
    content: `We share your information with third-party vendors and service providers that perform services on our behalf, such as payment processing (Stripe), cloud infrastructure (AWS), and analytics. We may also share information when required by law, to protect rights and safety, or in connection with a business transfer such as a merger or acquisition.`
  },
  {
    title: "Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide you the Service. You may request deletion of your account and associated data at any time by contacting us at privacy@ConnectBee.io. We will respond to deletion requests within 30 days.`
  },
  {
    title: "Data Security",
    content: `We implement industry-standard security measures to protect your personal information, including encryption in transit (TLS) and at rest, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`
  },
  {
    title: "International Data Transfers",
    content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws, including GDPR and PIPEDA where applicable.`
  },
  {
    title: "Your Rights & Choices",
    content: `Depending on your location, you may have rights to access, correct, or delete your personal information; object to or restrict certain processing; and receive a copy of your data in a portable format. To exercise any of these rights, contact us at privacy@ConnectBee.io. We will respond within 30 days.`
  },
  {
    title: "Cookies & Tracking",
    content: `We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. Essential cookies required for the Service to function cannot be disabled.`
  },
  {
    title: "Children's Privacy",
    content: `Our Service is not directed to children under the age of 16. We do not knowingly collect personal information from children under 16. If you become aware that a child has provided us with personal information, please contact us and we will take steps to remove such information.`
  },
  {
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our website at least 14 days before the changes take effect. Your continued use of the Service after changes constitutes acceptance of the updated policy.`
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        .serif { font-family: 'DM Serif Display', serif; }
      `}</style>

      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight">
            <span className="text-gray-900">Connect</span><span className="text-emerald-500">Bee</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Terms</Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Contact</Link>
            <Link href="/" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">← Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700 mb-8 tracking-wide uppercase">
            Legal · Privacy Policy
          </div>
          <h1 className="serif text-5xl text-gray-900 mb-6 leading-tight">
            Your Privacy<br /><em className="text-emerald-500 not-italic">Matters</em>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl">
            We are committed to protecting your personal information and being transparent about what data we collect and how we use it.
          </p>
          <p className="text-gray-400 text-sm mt-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Last updated February 20, 2026
          </p>
        </div>
      </div>

      {/* Quick summary */}
      <div className="border-b border-gray-100 bg-emerald-50/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-4">The short version</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "We never sell your data", desc: "Your contact lists and messages are yours alone." },
              { label: "You stay in control", desc: "Request access, correction, or deletion anytime." },
              { label: "We use minimal cookies", desc: "Only what's needed to run the service." },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 p-7 hover:border-emerald-200 hover:bg-gray-50/50 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h2 className="font-bold text-gray-900 mb-2">{section.title}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 rounded-2xl bg-gray-900 p-10 text-center">
          <p className="text-white font-bold text-lg mb-2">Privacy questions?</p>
          <p className="text-gray-400 text-sm mb-6">Email our privacy team directly at privacy@ConnectBee.io</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-all"
          >
            Contact us
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© 2026 ConnectBee. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
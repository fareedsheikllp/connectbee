import { Sora, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import SessionWrapper from "@/components/SessionWrapper";   
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  title: { default: "ConnectFlow", template: "%s · ConnectFlow" },
  description: "Turn WhatsApp into your revenue engine.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sora.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-surface-50 text-ink-800 antialiased" suppressHydrationWarning>
        <SessionWrapper>          
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "var(--font-sora)",
                fontSize: "0.875rem",
                borderRadius: "12px",
                border: "1px solid #e4ebe4",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
              },
            }}
          />
        </SessionWrapper>
      </body>
    </html>
  );
}
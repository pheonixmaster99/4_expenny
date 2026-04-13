import "./globals.css"
import "./fanta.css"
import Head from "./Head"
import Link from "next/link"
import GoTo from "@/components/GoTo"
import { AuthProvider } from "@/context/AuthContext"

export const metadata = {
  title: "Expenny | Subscription Tracker",
  description: "Track recurring subscriptions, upcoming bills, and savings opportunities in one dashboard.",
  manifest: "/manifest.webmanifest",
}

export default function RootLayout({ children }) {
  const header = (
    <header>
      <div>
        <Link href="/">
          <h1 className="text-gradient">Expenny</h1>
        </Link>
        <p>The subscription tracker</p>
      </div>
      <GoTo />
    </header>
  )

  const footer = (
    <footer>
      <div className="hard-line" />
      <div className="footer-content">
        <div>
          <div>
            <h4>Expenny</h4>
            <p>|</p>
            <button disabled>PWA ready</button>
          </div>
          <p className="copyright">Copyright 2024-2026, Khamosh Mehta. Built to make subscription tracking simpler.</p>
        </div>
        <div>
          <p>Facing issues? The dashboard now includes import/export and better billing visibility.</p>
          <p>Want more? Next up could be reminders, charts, and team sharing.</p>
          <div>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/tos">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )

  return (
    <html lang="en">
      <Head />
      <body>
        <AuthProvider>
          {header}
          <div className="full-line" />
          <main>{children}</main>
          {footer}
        </AuthProvider>
      </body>
    </html>
  )
}

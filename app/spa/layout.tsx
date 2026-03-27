import type { Metadata } from 'next'
import { Cormorant_Garamond, Montserrat } from 'next/font/google'
import './spa.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Serenity Spa — Luxury Wellness & Beauty',
  description: 'Discover tranquility at Serenity Spa. Premium massage therapy, facials, and wellness treatments in a serene sanctuary.',
}

export default function SpaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cormorant.variable} ${montserrat.variable} spa-root`}>
      {children}
    </div>
  )
}

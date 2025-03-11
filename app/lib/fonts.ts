import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import { Manrope } from 'next/font/google'
import { Sora } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
})

export const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
})

export const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
  style: ['normal'],
})

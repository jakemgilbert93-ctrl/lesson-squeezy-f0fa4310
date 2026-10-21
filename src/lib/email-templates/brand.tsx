import * as React from 'react'
import { Font, Img, Section, Text } from '@react-email/components'

// Email clients cannot consume the app stylesheet; mirror its light-theme roles here.
const colors = {
  paper: '#ffffff',
  primary: 'hsl(274, 24%, 47%)',
  foreground: 'hsl(275, 30%, 22%)',
  muted: 'hsl(274, 14%, 41%)',
  blush: 'hsl(338, 100%, 89%)',
  babyblue: 'hsl(208, 97%, 87%)',
}

export const main = { backgroundColor: colors.paper, fontFamily: 'Nunito, Arial, sans-serif' }
export const container = { maxWidth: '480px', padding: '24px' }
export const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: colors.foreground, margin: '24px 0 16px' }
export const text = { fontSize: '16px', color: colors.foreground, lineHeight: '1.6', margin: '0 0 20px' }
export const link = { color: colors.primary, textDecoration: 'underline' }
export const button = { backgroundColor: colors.primary, color: colors.paper, fontSize: '16px', fontWeight: 'bold' as const, border: `1px solid ${colors.primary}`, borderRadius: '8px', padding: '14px 24px', textDecoration: 'none' }
export const footer = { fontSize: '14px', color: colors.muted, lineHeight: '1.6', margin: '24px 0 0' }
export const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '26px', fontWeight: 'bold' as const, color: colors.primary, backgroundColor: colors.babyblue, padding: '16px', borderRadius: '8px', margin: '0 0 24px' }

export function BrandFont() {
  return <Font fontFamily="Nunito" fallbackFontFamily="Arial" webFont={{ url: 'https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshRTM.ttf', format: 'truetype' }} fontWeight={400} fontStyle="normal" />
}

export function EmailBrand() {
  return (
    <Section style={{ borderBottom: `3px solid ${colors.blush}`, paddingBottom: '20px' }}>
      <Img src="https://lessonsqueezy.com/email-logo.png" width="56" height="56" alt="Lesson Squeezy logo" />
      <Text style={{ color: colors.primary, fontSize: '24px', fontWeight: 'bold', margin: '12px 0 0' }}>Lesson Squeezy</Text>
    </Section>
  )
}

// Preserve the orchid button in clients that force dark mode.
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: ${colors.primary} !important; color: ${colors.paper} !important; }
  }
  [data-ogsc] .dm-btn { background-color: ${colors.primary} !important; color: ${colors.paper} !important; }
  [data-ogsb] .dm-btn { background-color: ${colors.primary} !important; color: ${colors.paper} !important; }
`
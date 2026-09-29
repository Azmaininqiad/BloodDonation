'use client'

import { en } from './en'
import { bn } from './bn'

export type Lang = 'en' | 'bn'

export const dictionaries = { en, bn } as const

export function getDict(lang: Lang) {
  return dictionaries[lang] ?? en
}

/** Read language preference from cookie (client side) */
export function getLangFromCookie(): Lang {
  if (typeof document === 'undefined') return 'en'
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/)
  const val = match?.[1]
  return val === 'bn' ? 'bn' : 'en'
}

/** Set language cookie */
export function setLang(lang: Lang) {
  if (typeof document !== 'undefined') {
    document.cookie = `lang=${lang};path=/;max-age=31536000`
  }
}

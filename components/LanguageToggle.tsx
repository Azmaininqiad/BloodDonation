'use client'

import { getLangFromCookie, setLang, type Lang } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function LanguageToggle() {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    setLangState(getLangFromCookie())
  }, [])

  function toggle() {
    const next: Lang = lang === 'en' ? 'bn' : 'en'
    setLang(next)
    setLangState(next)
    // Reload so all server components get the new cookie
    window.location.reload()
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Switch language">
      {lang === 'en' ? 'বাংলা' : 'English'}
    </Button>
  )
}

# Internationalization (i18n) Guide

This app supports multiple languages using react-i18next. Currently supported languages:
- English (en)
- Arabic (ar)

## Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome')}</p>
    </div>
  );
}
```

## Adding New Translations

1. Add the key-value pairs to both language files:
   - `src/i18n/locales/en.json`
   - `src/i18n/locales/ar.json`

2. Use the translation key in your component:
   ```tsx
   {t('your.new.key')}
   ```

## Adding More Languages

1. Create a new JSON file in `src/i18n/locales/` (e.g., `fr.json`)
2. Import it in `src/i18n/config.ts`:
   ```ts
   import fr from './locales/fr.json';
   ```
3. Add it to the resources:
   ```ts
   resources: {
     en: { translation: en },
     ar: { translation: ar },
     fr: { translation: fr },
   }
   ```
4. Update the language switcher in `src/components/LanguageSwitcher.tsx`

## RTL Support

Arabic language automatically enables RTL (right-to-left) layout. The `LanguageSwitcher` component handles this by setting the `dir` attribute on the document.

## Translation Structure

Translations are organized by feature/section:
- `common`: Shared UI elements (buttons, labels, etc.)
- `nav`: Navigation items
- `auth`: Authentication pages
- `dashboard`: Dashboard page
- `upload`: Upload functionality
- `analytics`: Analytics page
- `settings`: Settings page
- `subscription`: Subscription page
- `admin`: Admin panel
- `onboarding`: Onboarding flow
- `errors`: Error messages
- `empty`: Empty state messages

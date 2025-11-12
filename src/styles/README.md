# Design System & Utilities Guide

This guide explains the organized CSS structure and reusable utility classes available in the project.

## 📁 File Structure

- `src/index.css` - All design tokens, themes, and utility classes
- `tailwind.config.ts` - Tailwind configuration extending the design system

## 🎨 Design System Organization

### 1. CSS Variables (Design Tokens)

All design tokens are organized in `index.css` under the `:root` selector:

#### **Core Colors**
```css
--background: Background color for main content
--foreground: Text color on background
```

#### **Surface Colors**
```css
--card: Card background
--popover: Popover background
```

#### **Brand Colors (Gold)**
```css
--primary: Main brand color
--primary-light: Lighter variant
--primary-glow: Glowing effect variant
--primary-dark: Darker variant
```

#### **Status Colors**
```css
--destructive: Error states
--success: Success states
--warning: Warning states
--info: Info states
```

#### **Gradients**
```css
--gradient-primary: Main brand gradient
--gradient-primary-intense: Intense brand gradient
--gradient-subtle: Subtle background gradient
```

#### **Shadows**
```css
--shadow-card: Standard card shadow
--shadow-glow: Glowing effect shadow
--shadow-elevated: Elevated element shadow
```

#### **Transitions**
```css
--transition-smooth: Standard smooth transition (300ms)
--transition-fast: Fast transition (150ms)
--transition-slow: Slow transition (500ms)
```

### 2. Theme Support

The app supports **two themes** (Light & Dark):

- **Light Theme** - `.light` class
- **Dark Theme** - `.dark` class (default/root)

All themes use the same variable names for consistency.

## 🧩 Component Utility Classes

### Layout Patterns

Instead of repeating `flex items-center` everywhere, use these:

```tsx
// OLD WAY ❌
<div className="flex items-center justify-center gap-2">

// NEW WAY ✅
<div className="flex-center">
<div className="flex-gap-sm">      // gap-2
<div className="flex-gap-md">      // gap-3
<div className="flex-gap-lg">      // gap-4
<div className="flex-between">     // items-center + justify-between
<div className="flex-start">       // items-center + justify-start
<div className="flex-end">         // items-center + justify-end
```

### Card Patterns

```tsx
// Base card
<div className="card-base">

// Interactive card (hover effects)
<div className="card-interactive">

// Elevated card (with shadow)
<div className="card-elevated">
```

### Button-like Patterns

```tsx
// Icon that changes color on hover
<Icon className="interactive-icon" />

// Icon button with hover background
<button className="icon-button">
```

### Text Patterns

```tsx
// Muted text variants
<p className="text-muted-xs">  // text-xs + muted
<p className="text-muted-sm">  // text-sm + muted

// Headings
<h1 className="heading-page">     // Page title
<h2 className="heading-section">  // Section title
```

### Status Badges

```tsx
<span className="status-badge status-success">Success</span>
<span className="status-badge status-warning">Warning</span>
<span className="status-badge status-error">Error</span>
<span className="status-badge status-info">Info</span>
```

### Form Patterns

```tsx
<div className="input-group">
  <label className="input-label">Name</label>
  <input type="text" />
</div>
```

## ✨ Animation Utilities

### Hover Effects

```tsx
<div className="hover-lift">      // Lifts on hover (-translate-y-1)
<div className="hover-scale">     // Scales on hover (scale-105)
<div className="hover-glow">      // Glows on hover (shadow-glow)
```

### Text Effects

```tsx
<h1 className="gradient-text">    // Gradient text effect
<a className="link-underline">    // Animated underline on hover
```

### Glass Effect

```tsx
<div className="glass">           // Glassmorphism effect
```

### Text Truncation

```tsx
<p className="truncate-2">        // Clamp to 2 lines
<p className="truncate-3">        // Clamp to 3 lines
```

## 🎯 Usage Examples

### Before (Repetitive)

```tsx
// Old way with repeated patterns
<div className="flex items-center gap-3">
  <Icon className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
  <span className="text-sm text-muted-foreground">Text</span>
</div>

<div className="bg-card rounded-lg border border-border p-4 hover:shadow-card transition-shadow">
  Card content
</div>
```

### After (Using Utilities)

```tsx
// New way with utility classes
<div className="flex-gap-md">
  <Icon className="interactive-icon" />
  <span className="text-muted-sm">Text</span>
</div>

<div className="card-interactive p-4">
  Card content
</div>
```

## 🔧 Tailwind Config Integration

All CSS variables are mapped to Tailwind utilities in `tailwind.config.ts`:

```tsx
// Use design tokens in Tailwind classes
<div className="bg-primary text-primary-foreground">
<div className="shadow-glow">
<div className="bg-gradient-primary">
```

## 📝 Best Practices

1. **Always use design tokens** - Never hardcode colors
2. **Prefer utility classes** - Use `flex-gap-md` over `flex items-center gap-3`
3. **Use semantic naming** - `status-success` is better than `bg-green-500`
4. **Keep themes consistent** - Define all variants in each theme
5. **Document new patterns** - Add to this guide when creating new utilities

## 🚀 Adding New Utilities

To add a new utility pattern:

1. Define it in the `@layer components` section of `index.css`
2. Follow the naming convention (descriptive, semantic)
3. Document it in this README
4. Use HSL colors from CSS variables

Example:
```css
@layer components {
  .my-new-pattern {
    @apply flex items-center gap-2 p-4 rounded-lg bg-card;
  }
}
```

# Opioid Converter

## Overview

A medical tool for converting opioid dosages to a morphine milligram equivalent (MME) total. Designed for healthcare professionals to safely calculate opioid conversions using established medical conversion factors. Built with TypeScript, React, and Next.js.

**Live Demo**: [cooperability.com/demos/opioid-converter](https://cooperability.com/demos/opioid-converter)

---

## File Structure

```
opioid-converter/
├── OpioidConverter.tsx          # Main component file
├── OpioidConverter.module.css   # Component styling
├── types.ts                     # TypeScript interfaces
├── opioid_converter.mdx         # MDX documentation
└── OPIOID-CONVERTER-README.md   # This file
```

---

## Architecture

### Component Structure

**OpioidConverter.tsx** - Main Component

- State management for medication array and calculated equivalents
- Input handlers for dose changes and increments
- Real-time calculation of the MME total
- Table-based UI for medication entry
- Conversion factors for all 14 medications

**OpioidConverter.module.css** - Styling

- Responsive table layout
- Accessible form controls
- Theme-aware (light/dark mode)

---

## Features

### Core Functionality ✓

- **14+ Opioid Medications**: Butrans, Codeine, Duragesic, Hydrocodone, Hydromorphone, Levorphanol, Meperidine, Methadone, Morphine, Oxycodone, Oxymorphone, Pentazocine, Tapentadol, Tramadol
- **Morphine Equivalence**: Real-time calculation based on established conversion factors
- **Methadone**: converts to MME at the CDC 2022 factor of 4.7. The calculator does not convert an MME total back into a methadone dose
- **Dose Input**: Manual entry or increment/decrement buttons
- **Clear All**: One-button reset of all medications

### User Experience

- **Real-time Updates**: Calculations update instantly as doses change
- **Increment Controls**: Pre-set increments for each medication (e.g., 5mg for Morphine, 2.5mg for Oxycodone)
- **Visual Feedback**: Active input highlighting, disabled states for decrement buttons
- **Accessible**: ARIA labels, keyboard navigation, screen reader support

---

## Performance Optimizations

### Dynamic Import & Code Splitting

The Opioid Converter is loaded using Next.js `dynamic()` import with SSR disabled. See `src/app/demos/opioid-converter/opioid-converter-client.tsx` for the implementation, which includes a loading skeleton to reduce server bundle size.

**Benefits**:

- **Reduced initial bundle size**: Component code only loads when navigating to `/demos/opioid-converter`
- **Improved FCP (First Contentful Paint)**: Other pages don't include this component's JavaScript
- **Better LCP (Largest Contentful Paint)**: Loading skeleton provides immediate visual feedback
- **Code splitting**: Next.js automatically creates a separate chunk for this component

**Performance Impact**:

- Initial page load: ~15KB JavaScript removed from main bundle
- Route-specific loading: Component loads only when needed (~150ms on fast connections)
- Server rendering: Disabled to reduce server-side processing time

### Calculation Optimization

- **useCallback**: All event handlers memoized to prevent unnecessary re-renders
- **useEffect**: Calculations only run when medication doses change
- **Efficient State Updates**: Batch state updates to minimize re-renders

---

## Medical Conversion Factors

Ten factors come from the Table in the [CDC Clinical Practice Guideline for Prescribing Opioids for Pain, 2022](https://www.cdc.gov/mmwr/volumes/71/rr/rr7103a1.htm). That table leaves out four of the converter's medications, so their factors come from the [CMS Opioid Oral MME Conversion Factors, August 2017](https://web.archive.org/web/20170831231127/https://www.cms.gov/Medicare/Prescription-Drug-Coverage/PrescriptionDrugCovContra/Downloads/Opioid-Morphine-EQ-Conversion-Factors-Aug-2017.pdf), and the page marks those rows with an asterisk.

| Medication              | Factor | Unit | Source   |
| ----------------------- | ------ | ---- | -------- |
| Butrans (buprenorphine) | 1.8    | µg/h | CMS 2017 |
| Codeine                 | 0.15   | mg   | CDC 2022 |
| Duragesic (fentanyl)    | 2.4    | µg/h | CDC 2022 |
| Hydrocodone             | 1.0    | mg   | CDC 2022 |
| Hydromorphone           | 5.0    | mg   | CDC 2022 |
| Levorphanol             | 11     | mg   | CMS 2017 |
| Meperidine              | 0.1    | mg   | CMS 2017 |
| Methadone               | 4.7    | mg   | CDC 2022 |
| Morphine                | 1.0    | mg   | CDC 2022 |
| Oxycodone               | 1.5    | mg   | CDC 2022 |
| Oxymorphone             | 3.0    | mg   | CDC 2022 |
| Pentazocine             | 0.37   | mg   | CMS 2017 |
| Tapentadol              | 0.4    | mg   | CDC 2022 |
| Tramadol                | 0.2    | mg   | CDC 2022 |

CMS lists the buprenorphine patch at 12.6, which assumes one 7-day patch spread over a week of claims data. Its footnote gives the per-day factor as 1.8, and the converter takes a dose per day, so it uses 1.8. The CDC 2022 guideline excludes buprenorphine pain products because, as a partial agonist, their effect has a ceiling.

### Methadone Conversion

Methadone converts to MME linearly at 4.7, the factor in the Table of the [CDC Clinical Practice Guideline for Prescribing Opioids for Pain, 2022](https://www.cdc.gov/mmwr/volumes/71/rr/rr7103a1.htm) (Dowell et al., MMWR Recomm Rep 2022;71(No. RR-3)).

The calculator shows no methadone dose for an MME total. The guideline says not to use a calculated MME dose to convert one opioid to another, because cross-tolerance is incomplete.

---

## Usage

### Integration

```tsx
import OpioidConverter from '@/components/opioid-converter/OpioidConverter'

function MyPage() {
  return <OpioidConverter />
}
```

### Medical Disclaimer

⚠️ **Important**: This tool is for reference only and should not replace clinical judgment. Always consult with a healthcare professional for medical decisions.

---

## Dependencies

- `react`: Core React library
- `next`: Next.js framework
- `@/components/ui/button`: shadcn/ui Button component
- `next/image`: Next.js Image component for optimized logo loading

---

## Browser Compatibility

**Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
**Mobile**: iOS Safari 14+, Chrome Mobile 90+

---

## Future Enhancements

Potential areas for expansion:

1. **Additional Medications**: Extended opioid formulary
2. **Route of Administration**: IV vs. oral conversion factors
3. **Patient-Specific Factors**: Age, renal function, tolerance
4. **Export Functionality**: PDF/printable conversion report
5. **History Tracking**: Save previous conversions
6. **Validation**: Dose range warnings and safety checks

---

## Mobile Refinement Learnings

Extensive mobile refinement was required for this data-dense table. Key techniques:

- **CSS Grid Adjustments**: Used `grid-template-columns` with `minmax()` for flexible column sizing
- **Input Sizing**: Set appropriate `min-width` on inputs to prevent squishing
- **Header Text Wrapping**: Applied `white-space: normal` for long header labels
- **Element Gaps**: Adjusted `gap` values for touch-friendly spacing
- **Responsive Sizing**: Used `clamp()` for fluid font sizes and padding

These techniques are applicable to any data-dense table component requiring mobile support.

---

## Maintenance Notes

- Conversion factors are defined in `OpioidConverter.tsx` as `MEDICATION_ARRAY`
- Styling is modularized in `OpioidConverter.module.css`
- Component follows React best practices with hooks and memoization
- **Performance**: Uses dynamic imports to avoid impacting other pages' bundle size

---

**Status**: ✅ Complete and production-ready

**Repository**: [github.com/cooperability/cooperability.com](https://github.com/cooperability/cooperability.com)

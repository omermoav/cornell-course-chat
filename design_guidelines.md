# Cornell Classes Q&A Chatbot - Design Guidelines

## Design Approach

**System Selected**: Material Design 3 principles adapted for academic utility
**Rationale**: This is a utility-focused, information-dense application requiring clear hierarchy, efficient scanning, and professional credibility. The design prioritizes quick information retrieval over aesthetic flourish.

**Core Principles**:
- Academic professionalism with approachable usability
- Information hierarchy optimized for scanning
- Minimal cognitive load through clear visual structure
- Trust signals through clean, authoritative presentation

---

## Layout System

**Container Strategy**:
- Main application: `max-w-4xl mx-auto` - optimal reading width for course information
- Search input area: `w-full max-w-2xl mx-auto` - focused, centered interaction
- Answer cards: Full container width with internal padding
- Spacing primitives: Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm

**Vertical Structure**:
- Header: `py-6 md:py-8` - compact but present
- Search section: `py-12 md:py-16` - primary focus area
- Results area: `py-8` between cards, `p-6 md:p-8` within cards
- Footer: `py-8` - minimal, informational

---

## Typography Hierarchy

**Font Families** (Google Fonts):
- Primary: **Inter** (400, 500, 600, 700) - clean, highly readable for UI and data
- Monospace: **JetBrains Mono** (400, 500) - course codes and technical identifiers

**Type Scale**:
- H1 (App Title): `text-3xl md:text-4xl font-bold` - strong presence without overwhelming
- H2 (Section Headers): `text-2xl md:text-3xl font-semibold` - clear hierarchy
- H3 (Course Titles): `text-xl md:text-2xl font-semibold` - prominent information
- Body Text: `text-base leading-relaxed` - comfortable reading
- Course Codes: `font-mono text-sm md:text-base font-medium` - distinctive, scannable
- Metadata/Labels: `text-sm font-medium uppercase tracking-wide` - clear categorization
- Small Text (Sources): `text-xs md:text-sm` - supporting information

---

## Component Library

### Navigation Header
- Cornell branding section: University name in `text-lg font-semibold`
- App title: "Classes Q&A" in `text-2xl md:text-3xl font-bold`
- Optional API status indicator: Small badge with `text-xs`
- Layout: Centered with `py-6` vertical padding

### Search Input Section
- Primary search box: Large, prominent `h-14 md:h-16` input field
- Placeholder: "Ask about any Cornell class... (e.g., 'Is NBAY 5500 pass/fail?')"
- Icon: Search icon (Heroicons) positioned at `left-4`
- Input styling: `text-base md:text-lg px-12 rounded-lg` with subtle shadow
- Submit button: Adjacent or enter-triggered, `h-14 md:h-16` to match input
- Example questions: Below input, `text-sm` chips/links showing common patterns

### Answer Card
**Structure**:
- Card container: `rounded-xl shadow-md` with `p-6 md:p-8`
- Course header section:
  - Course code in monospace: `font-mono text-lg md:text-xl font-semibold`
  - Course title: `text-xl md:text-2xl font-semibold mt-2`
  
**Information Grid**:
- Use 2-column grid on md+: `grid md:grid-cols-2 gap-6`
- Each info block:
  - Label: `text-sm font-medium uppercase tracking-wide mb-1`
  - Value: `text-base md:text-lg`
  
**Provenance Badge**:
- Position: Top-right of card or below course title
- Style: `inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium`
- Content: "Source: Fall 2025 (FA25)" format
- Icon: Small calendar or database icon from Heroicons

**Action Buttons**:
- Primary: "Open Class Page" / "View Syllabus"
- Style: `px-6 py-3 rounded-lg text-base font-medium`
- Layout: Full-width on mobile, inline on desktop
- Icon: External link icon from Heroicons

### Info Display Patterns

**Grading Basis Display**:
- Large, clear presentation with `text-lg md:text-xl`
- If varies by section: List format with `space-y-2`
- Section identifiers in monospace

**Credits Display**:
- Format: "3-4 credits" in `text-lg font-semibold`
- Range clearly indicated

**Schedule Information**:
- Meeting times in tabular format
- Days: `font-medium`
- Times: Standard weight
- Grid: `grid gap-2`

**Multiple Terms History**:
- Timeline list with `space-y-3`
- Each term: Badge + basic info
- Most recent highlighted

### Status Messages

**Loading State**:
- Skeleton cards with `animate-pulse`
- Placeholder blocks matching answer card structure

**Error Messages**:
- Alert card with `rounded-lg border-l-4 p-4`
- Icon: Warning icon from Heroicons
- Text: `text-sm md:text-base`

**No Data Found**:
- Centered message with helpful suggestion
- "May be new course..." explanation
- `text-base md:text-lg` for readability

**Policy Messages** (pass-rate requests):
- Information card with distinct border
- Icon: Info icon from Heroicons
- Clear policy explanation in `text-base leading-relaxed`

### Badges & Pills
- Term badges: `px-2 py-1 rounded text-xs font-medium`
- Status indicators: `inline-flex items-center`
- Course level tags (if shown): Small, subtle pills

### Footer
- API attribution: "Data from Cornell Class Roster API"
- Rate limit status (optional): Small indicator
- Last sync time (optional): `text-xs`
- Layout: Centered, `py-8 text-sm`

---

## Interaction Patterns

**Search Flow**:
1. User types natural question
2. On submit, input remains visible at top with slight elevation
3. Loading state appears below
4. Answer card animates in with `transition-all duration-300 ease-in-out`
5. Card remains for reference; new searches replace content

**Multi-Question Sessions**:
- Previous answer fades slightly when new search submitted
- Clear visual focus on current answer
- Optional: Recent questions sidebar on desktop (collapsible)

---

## Responsive Behavior

**Mobile (< 768px)**:
- Single column layout throughout
- Search input: Full width with `px-4` container padding
- Answer cards: Full width, generous internal padding `p-6`
- Info grid: Single column, stacked
- Buttons: Full width
- Font sizes: Use smaller end of scale

**Tablet/Desktop (≥ 768px)**:
- Centered layout with max-width constraints
- 2-column info grids
- Inline button groups
- Larger typography scale
- More generous spacing (use larger spacing units)

---

## Assets & Icons

**Icon Library**: Heroicons (via CDN)
- Search: `MagnifyingGlassIcon`
- External link: `ArrowTopRightOnSquareIcon`
- Calendar/term: `CalendarIcon`
- Info: `InformationCircleIcon`
- Warning: `ExclamationTriangleIcon`
- Check: `CheckCircleIcon`

**No Images Required**: This is a utility application focused on information retrieval. No hero images or decorative photography needed.

---

## Micro-Interactions

**Minimal Animation Policy**:
- Card entry: Subtle fade + slide up (`transition-all duration-300`)
- Button states: Slight scale on press (`active:scale-95`)
- Badge pulsing: Only for "live" status indicators
- Loading: Gentle skeleton pulse
- NO elaborate scroll animations or decorative effects

---

## Information Density Strategy

**High-Density Displays**:
- Course information prioritized above fold
- All critical data (grading, credits, instructor, time) visible without scrolling
- Compact but not cramped: Adequate breathing room with `space-y-4 md:space-y-6`

**Scannable Layout**:
- Strong visual hierarchy through size and weight contrast
- Consistent label positioning (top-left of each info block)
- Monospace course codes stand out from prose
- Clear sectioning with subtle dividers (`border-t mt-6 pt-6`)
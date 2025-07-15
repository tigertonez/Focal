# **App Name**: Forecasting SaaS Platform

## Core Features:

- Scaffold Creation: Sets up folder structure, engine, API routes, UI components, configs, and globals to set the foundation of the platform.
- Type Safety Setup: Sets up TypeScript types for engine inputs and outputs based on forecasting requirements.
- KPI Visualization: KpiCard displays Key Performance Indicators. Data consumed from /lib/engine.ts output.
- Page Layouts: Components rendering revenue, costs, profit, cash flow, and summary.
- Financial Charting: Interactive charts that plot data consumed from /lib/engine.ts
- AI-Powered Q&A: The 'ask' tool connects to the OpenAI API, sending prompts defined in `/prompts/ask.md`, and makes its decision about incorporating user input based on current engine data.

## Style Guidelines:

- Primary color: Deep purple (#6750A4) to convey sophistication and data-driven insights.
- Background color: Light gray (#F2F0F7), for a clean and professional backdrop that won't distract from content.
- Accent color: Teal (#00A393) is chosen to provide highlights without clashing with the professionalism.
- Headline font: 'Space Grotesk' (sans-serif), and for the body use 'Inter' (sans-serif).
- Font sizes: Label --fs-label: 12px, Value --fs-value: 24px. Weights 600/700 only.
- Mobile: 8px side margins, sticky bottom tab bar, touch targets ≥44px. Desktop: fixed top nav.
- Input forms full width on mobile devices.
- Ensure no black borders are present. Card sizes should remain consistent.
- Simple, professional icons for key actions and data points.
- Subtle transitions and animations to enhance user experience without being distracting.
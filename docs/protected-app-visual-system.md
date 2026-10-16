# Protected app visual system

The Ticket 21 dashboard is the visual reference for `/app`, Explorer, Analytics, and Chat. The application keeps a warm cream background, deep navy headings, white surfaces, neutral borders, restrained shadows, groundwater blue, and environmental green. The existing shell and navigation remain shared across all protected pages.

Tokens live on `.app-shell` in `app/globals.css`: `--nd-navy`, `--nd-green`, `--nd-blue`, `--nd-cream`, `--nd-surface`, `--nd-border`, `--nd-muted`, `--nd-radius`, and `--nd-shadow`. The five `--nd-class-*` colors drive the dashboard donut and the secondary pages: safe green, semi critical amber, critical orange, over exploited red, and salinity pink. Missing data uses neutral gray.

`app/app/protected-visual.css` provides scoped patterns for editorial page headers, cards, controls, metric tiles, classification bars and badges, status messages, chat surfaces, and loading skeletons. DM Serif Display is reserved for the brand, page titles, section identity, and prominent location names. Geist remains the interface font for forms, numbers, charts, tables, navigation, and messages.

Explorer retains district, assessment-unit, and year selection with URL state. Its filter surface and selected assessment now read as a compact groundwater report. Analytics retains every map, chart, comparison, table, and calculation with the same card and heading treatment. Chat retains its request flow, history, prompts, grounded badge, source metadata, and composer, with calmer navy and cream surfaces.

Protected pages use the existing sidebar at desktop widths and the existing menu on smaller screens. Editorial headers stack at tablet widths, and the detailed Analytics map uses a full-width column before its selected-district panel. Tables scroll inside their cards; mobile cards and chat controls stack without page-level horizontal overflow. Focus rings, labels, text classifications, safe error states, and reduced-motion skeletons remain visible. Groundwater volumes remain in ha-m; record, unit, district, and classification counts do not carry volume units.

The dashboard keeps its compact command-center layout. Secondary pages use the same materials and typography but remain detailed workspaces, so their maps, tables, and conversation areas take more space than dashboard previews.

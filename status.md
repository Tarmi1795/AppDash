## Goal

Complete dashboard light mode implementation for the Applus Dashboard React application, including:
- Full light mode support with amber/copper color scheme
- Default light mode on dashboard
- Updating all UI components (filters, cards, charts, tables, navigation)
- Fix Supabase database save issues with date format parsing
- Add Records CRUD management tab

## Instructions

- Keep light mode using the same copper/amber color scheme
- Default view should be dashboard with light mode
- Update all KPI cards, charts, and tables to have proper light mode styling
- Column P onwards in Excel files should be ignored (not saved to database)
- Implement full CRUD for Records management tab
- Fix date parsing for dd/mm/yyyy format from Excel

## Discoveries

- ThemeContext already defaults to 'light' and persists to localStorage
- Dashboard was hardcoded with dark-only styling (text-white, dark gradients)
- Excel files have extra columns (__EMPTY, CLICK_HERE_DASHBOARD_LINK, etc.) that don't exist in database schema
- Excel dates are in dd/mm/yyyy format but PostgreSQL expects ISO format
- Column name mapping needed: `DEPARTMENT(sample data)` → `DEPARTMENT`
- Supabase table needed `SET datestyle = 'ISO, DMY'` for proper date handling
- Valid columns A-O from Excel, P onwards ignored

## Accomplished

- [x] Created `RecordManagement.tsx` component with full CRUD (Add, Edit, Delete)
- [x] Added Records tab to TopNav navigation
- [x] Updated `updateDirectEntry()` function in supabase.ts for edit functionality
- [x] Fixed date parsing in `bulkSaveEntries()` with `parseDate()` function for dd/mm/yyyy format
- [x] Created `supabase_schema.sql` with correct table definition and column mappings
- [x] Updated Dashboard root container with light mode background gradient
- [x] Updated filter row inputs, labels, and dropdowns for light mode
- [x] Updated TopNav with light mode styling
- [x] Updated KPI cards text colors for light mode
- [x] Updated Revenue Trajectory section for light mode
- [x] Updated Contract Balances table for light mode (header bg, text colors, borders)
- [x] Updated Running Balance chart for light mode (axis colors, grid lines)
- [x] Updated Client Balances section for light mode (chart, table)
- [x] Updated Department Overview section for light mode
- [x] Updated Footer for light mode
- [x] Updated CustomTooltip for light mode with theme prop

## Work Left

- [ ] Update Dashboard version number (currently v2.0.4, should be v2.1.0)
- [ ] Commit and push changes to GitHub

## Relevant files / directories

- `src/components/Dashboard.tsx` - Main dashboard with full light mode styling
- `src/components/TopNav.tsx` - Navigation bar with light mode styling
- `src/components/RecordManagement.tsx` - New CRUD management component
- `src/context/ThemeContext.tsx` - Theme management (already correct)
- `src/utils/supabase.ts` - Database utilities with date parsing
- `supabase_schema.sql` - Database schema SQL
- `src/App.tsx` - Main app with routing
- `src/components/Previewer.tsx` - File upload and preview component
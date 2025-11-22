# Maisy Mylod - Multi-Page Portfolio

A professional, multi-page portfolio showcasing front-end development and client portal building skills.

## Features

### 5 Pages
- **Home** - Landing page with stats and recent work
- **Experience** - Timeline of work history with detailed accomplishments
- **Projects** - Filterable project grid with search functionality
- **Dashboard** - Analytics dashboard with charts and tracking metrics
- **Contact** - Working contact form with validation

### Front-End Capabilities Demonstrated
- Multi-page navigation
- Form handling and validation
- Search and filter functionality
- Data visualization with Chart.js
- Responsive design
- Clean, professional UI

## Tech Stack

- HTML5
- Tailwind CSS
- JavaScript (vanilla)
- Chart.js (for dashboard)
- Font Awesome (icons)

## Quick Start

### Preview Locally
1. Download all HTML files
2. Open `index.html` in your browser
3. Navigate between pages using the menu

### Deploy to GitHub Pages

```bash
# Clone or create your repository
git init
git add .
git commit -m "Initial commit: Multi-page portfolio"

# Push to GitHub
git remote add origin https://github.com/maisymylod/portfolio.git
git branch -M main
git push -u origin main
```

### Enable GitHub Pages
1. Go to repository Settings
2. Navigate to Pages
3. Source: Deploy from main branch
4. Save

Your site will be live at: `https://maisymylod.github.io/portfolio`

## File Structure

```
portfolio/
├── index.html           # Home page
├── experience.html      # Experience timeline
├── projects.html        # Projects with filtering
├── dashboard.html       # Analytics dashboard
├── contact.html         # Contact form
└── README.md           # This file
```

## Pages Overview

### Home (index.html)
- Hero section with availability badge
- Key metrics grid ($1B+, 40% efficiency, etc.)
- Technical skills showcase
- Recent work highlights
- CTA sections

### Experience (experience.html)
- Visual timeline of work history
- Detailed bullet points for each role
- Technology tags for each position
- Education section with coursework

### Projects (projects.html)
- Search functionality
- Category filters (All, Data, Frontend, Full Stack)
- 6 project cards with descriptions
- Technology tags and status badges
- No results state handling

### Dashboard (dashboard.html)
- 4 KPI cards (visitors, page views, session time, bounce rate)
- Line chart for visitor traffic over time
- Bar chart for page performance
- Doughnut chart for traffic sources
- Top pages ranking table
- Real-time activity log
- Refresh button and time range selector

### Contact (contact.html)
- Contact form with validation
- Character counter for message field
- Subject dropdown selector
- Success/error message handling
- Contact info cards (email, GitHub, location, phone)
- Quick info section with availability

## Key Features

### Search & Filter (Projects Page)
```javascript
// Real-time search
- Filters by project name, description, and keywords
- Updates instantly as you type

// Category filters
- All, Data, Frontend, Full Stack
- Shows/hides projects based on category
- Active filter highlighted in blue
```

### Form Validation (Contact Page)
```javascript
// Required fields
- Name, email, subject, message

// Character limit
- 500 characters max on message
- Real-time character counter
- Visual warning when limit exceeded

// Submission handling
- Shows loading state
- Displays success message
- Resets form after submission
```

### Dashboard Charts
```javascript
// Three chart types
- Line chart (visitor traffic)
- Bar chart (page performance)
- Doughnut chart (traffic sources)

// Features
- Responsive to window size
- Color-coded data
- Interactive hover states
```

## Customization

### Update Content
All content is in the HTML files. Search for:
- `maisymylod@gmail.com` - Your email
- `(248) 707-0429` - Your phone
- `https://github.com/maisymylod` - Your GitHub
- Company names and dates in experience.html
- Project details in projects.html

### Change Colors
Primary color is blue (`#3b82f6`). To change:
- Search for `bg-blue-600`, `text-blue-600`, etc.
- Replace with your color classes
- Update Chart.js colors in dashboard.html

### Add New Pages
1. Copy an existing HTML file
2. Update the navigation menu in all files
3. Add content to the new page
4. Update links to the new page

## Why This Works for Front-End Roles

### Demonstrates Key Skills
✅ Multi-page architecture
✅ Form handling and validation
✅ Client-side filtering and search
✅ Data visualization
✅ Responsive design
✅ Clean, maintainable code

### Shows Portal-Building Capabilities
✅ Dashboard with real-time metrics
✅ User input collection (forms)
✅ Data filtering and search
✅ Navigation across multiple views
✅ Professional UI/UX

### Production-Ready Features
✅ Mobile responsive
✅ Accessible navigation
✅ Error handling
✅ Loading states
✅ User feedback messages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Performance

- Fast loading (no heavy frameworks)
- Optimized images (gradient backgrounds instead of photos)
- Minimal dependencies (Tailwind CDN, Chart.js, Font Awesome)
- Client-side rendering for instant page transitions

## Future Enhancements

Potential additions to showcase more skills:
- Backend API integration for contact form
- Database-driven projects page
- User authentication system
- Real analytics integration (Google Analytics)
- Dark mode toggle
- Export dashboard data to CSV
- Project detail pages

## License

Free to use for your own portfolio

---

Built by Maisy Mylod | New York, NY | maisymylod@gmail.com

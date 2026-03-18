# LeadScraper Pro – Google Maps Lead Extraction Extension

A powerful Chrome extension that extracts **80+ data fields** from Google Maps listings, including contact info, social media profiles, GMB metadata, hours, and technical signals from business websites.

## Features

- **80+ fields per lead** – see full list below
- **Real-time dashboard** – watch leads pour in live
- **Website enrichment** – visits each business website to extract emails, social links, Facebook Pixel IDs, GTM containers, logos
- **Multi-keyword** – queue multiple keywords, scrapes them sequentially
- **Duplicate detection** – skip already-scraped businesses
- **Export** – CSV (UTF-8 with BOM for Excel) and XLSX (Excel with styled headers)
- **Column manager** – show/hide any of the 80 columns
- **Filter & sort** – search across all fields in real-time

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `gmaps-scraper/` folder
5. Click the extension icon → **Open Dashboard**

## Usage

1. Open the dashboard (click extension icon → Open Dashboard)
2. Enter keywords (one per line), e.g.:
   ```
   dentists
   plumbers Miami
   lawyers New York
   ```
3. Enter a location (optional if already in keywords)
4. Toggle **Enrich from websites** for emails/social data
5. Click **Start Scraping**
6. Watch results appear in real-time
7. Export to CSV or Excel when done

## Data Fields (80+)

### Core
| Field | Description |
|-------|-------------|
| Business Name | Official name from GMB |
| First Category | Primary business category |
| Second Category | Secondary category |
| Claimed GMB | Whether listing is claimed |
| Avg Rating | Star rating (1-5) |
| Reviews Count | Total review count |

### Contact
| Field | Description |
|-------|-------------|
| Phone | Formatted: +1 (XXX) XXX-XXXX |
| Phone (Raw) | As shown on Google Maps |
| Email 1, 2 | Extracted from website |
| Website | Business website URL |
| Clean Website | Normalized URL |
| Domain | Root domain only |

### Address
| Field | Description |
|-------|-------------|
| Full Address | Complete address string |
| Street Address | House number + street |
| City | City name |
| State | State abbreviation |
| Zip Code | Postal code |
| Municipality | Borough/township |
| Country | Country name |
| Time Zone | (requires timezone API) |

### Social Media (from website)
Facebook · Instagram · LinkedIn · YouTube · TikTok · Twitter/X · Yelp

### Hours
Hours (Summary) · Monday · Tuesday · Wednesday · Thursday · Friday · Saturday · Sunday

### GMB / Google IDs
| Field | Description |
|-------|-------------|
| Place ID | `ChIJ...` or `0x...` identifier |
| CID | Google Customer ID |
| KGMID | Knowledge Graph ID (`/g/...`) |
| Google Feature ID | Internal feature ID |
| Latitude / Longitude | Precise coordinates |
| Coordinates | `lat,lng` combined |
| GMB URL | Direct Google Maps URL |
| Google Knowledge URL | Knowledge panel search URL |
| Photos Page URL | Photos tab URL |
| Review URL | Google review page |
| Menu Link | Menu URL if available |

### Tech Signals (from website)
| Field | Description |
|-------|-------------|
| Facebook Pixel ID | `fbq('init', ...)` pixel ID |
| GTM Container | `GTM-XXXXXXX` container ID |
| Favicon URL | Business favicon |
| Logo URL | From schema.org or og:image |

### UTM Parameters
UTM Source · UTM Medium · UTM Campaign (from website URL)

### Business Attributes (from GMB)
Service Options · Accessibility · Crowd · Amenities · From Business · Payments · Offerings

### Meta
Keyword (which keyword triggered this) · Scraped At (timestamp)

## Architecture

```
gmaps-scraper/
├── manifest.json              # Extension config (Manifest V3)
├── background.js              # Service worker – session mgmt, storage
├── content/
│   ├── gmaps-scraper.js       # Injected into Google Maps pages
│   └── website-scraper.js     # Injected into business websites
├── dashboard/
│   ├── index.html             # Full-page dashboard
│   ├── app.js                 # Dashboard application (~500 lines)
│   └── styles.css             # Dark theme UI styles
├── popup/
│   ├── popup.html             # Extension popup
│   └── popup.js               # Popup logic
├── icons/                     # Extension icons (16/32/48/128px)
└── generate-icons.js          # Icon generator script
```

## Scraping Flow

1. User enters keywords + location, clicks Start
2. Background opens a Google Maps tab
3. URL formatted: `https://www.google.com/maps/search/{keyword+location}/`
4. Content script detects page load, scrolls results to load all listings
5. For each listing:
   - Clicks to open detail panel
   - Extracts all available GMaps fields from DOM + URL
   - Sends data to background worker
6. Background stores lead in `chrome.storage.local`
7. If website enrichment enabled: visits each business website in a new background tab
8. Website scraper extracts emails, social links, Pixel IDs, etc.
9. Leads updated with enriched data
10. Moves to next keyword
11. Dashboard updates in real-time via messaging

## Tips

- **Rate limiting**: Default 1.5s delay between listings – increase if you get blocked
- **Website enrichment**: Adds 3-5s per lead for website visits; disable for faster scraping
- **Duplicates**: The extension deduplicates by Place ID across sessions
- **Max results**: Google Maps typically shows 120 results per search; use specific locations for more focused lists
- **Anti-detection**: Extension uses human-like delays and random intervals

## Notes

- This tool is for legitimate lead generation and research purposes
- Respect Google Maps Terms of Service for your use case
- Use reasonable delays to avoid IP-based rate limiting
- Data quality depends on how complete the GMB listing is

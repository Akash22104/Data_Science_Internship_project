# Frontend

The frontend provides a browser-based interface for uploading CSV files and visualizing backend analysis.

## Setup

```bash
cd auto-data-analyst/frontend
python -m http.server 5500
# Open http://localhost:5500/index.html
```

## Configuration

Edit `config.js` to point to your backend API if not using default localhost setup.

## Usage

1. Open the web app.
2. Upload a CSV file.
3. Wait for analysis response.
4. Review profile cards, ML summary, and insight recommendations.

## Main Files

- `index.html` page structure
- `style.css` app styling
- `config.js` API endpoints and constants
- `app.js` upload, API call, and result rendering logic

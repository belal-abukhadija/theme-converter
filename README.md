# Logo Light to Dark Converter

A simple web application that converts white/light-colored logos to black versions suitable for light mode websites. Process multiple images at once and download them all as a ZIP file.

## Features

- **Batch Processing**: Upload and convert multiple images simultaneously
- **Drag & Drop**: Easy drag-and-drop interface or traditional file browsing
- **Smart Conversion**: Converts white/light pixels to black while preserving:
  - Transparency (alpha channel)
  - Dark colors and details
  - Original image quality
- **Preview**: Side-by-side comparison of original and converted images
- **Bulk Download**: Download all converted images as a single ZIP file
- **Client-Side**: All processing happens in your browser - no server required, no data uploaded

## Quick Start

### Option 1: Open Directly in Browser

1. Simply open `index.html` in any modern web browser
2. Start uploading and converting images!

### Option 2: Run with Local Server (Recommended)

For the best experience, run with a local development server:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js (with npx):**
```bash
npx serve
```

**Using PHP:**
```bash
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## How to Use

1. **Upload Images**:
   - Drag and drop logo images onto the upload area, OR
   - Click "Browse Files" to select multiple images
   - Supports: PNG, JPG, JPEG, WebP

2. **Processing**:
   - The app automatically processes all uploaded images
   - White and light-colored pixels are converted to black
   - Transparency is preserved (especially for PNGs)
   - Progress bar shows conversion status

3. **Download Results**:
   - View side-by-side comparison of original vs converted
   - Download individual images by clicking "Download" on each
   - Or click "Download All as ZIP" to get all converted images at once

4. **Convert More**:
   - Click "Convert More Images" to start over with new files

## Technical Details

### Technologies Used

- **HTML5**: Structure and Canvas API for image manipulation
- **CSS3**: Modern, responsive styling with gradients and animations
- **Vanilla JavaScript**: No framework dependencies for core functionality
- **JSZip**: Library for creating ZIP files (loaded from CDN)

### How It Works

The conversion algorithm:
1. Loads each image onto an HTML5 Canvas
2. Reads pixel data using Canvas API
3. For each pixel, calculates brightness: `(R + G + B) / 3`
4. If brightness ≥ 200 (configurable threshold) and pixel is not transparent:
   - Converts RGB to (0, 0, 0) - pure black
   - Preserves the alpha channel (transparency)
5. Outputs as PNG format to maintain transparency

### Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas API
- FileReader API
- Blob API
- ES6 JavaScript

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Project Structure

```
light-to-dark/
├── index.html          # Main HTML structure
├── style.css           # Styling and responsive design
├── app.js              # Main application logic & UI
├── image-processor.js  # Image conversion algorithm
└── README.md           # This file
```

## Customization

### Adjust Brightness Threshold

Edit the threshold in `image-processor.js` (default: 200):

```javascript
// Line ~14 in image-processor.js
static async convertWhiteToBlack(file, threshold = 200) {
```

- Lower values (e.g., 180): Converts more pixels to black
- Higher values (e.g., 220): Only converts very light pixels

### Change Output Format

Modify the output format in `image-processor.js` (line ~75):

```javascript
canvas.toBlob((blob) => {
    // ...
}, 'image/png'); // Change to 'image/jpeg' or 'image/webp'
```

## Deployment

### GitHub Pages

1. Create a new repository on GitHub
2. Push all files to the repository
3. Go to Settings → Pages
4. Select main branch as source
5. Your app will be live at `https://yourusername.github.io/repo-name`

### Netlify

1. Drag and drop the entire folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repository for automatic deployments

### Vercel

```bash
npm i -g vercel
vercel
```

## License

This project is free to use and modify for any purpose.

## Support

For issues or questions, please check:
- Ensure your browser supports HTML5 Canvas
- Try using PNG images for best results with transparency
- Check browser console for any error messages

---

Made with ❤️ for designers and developers who need quick logo conversions.

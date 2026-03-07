/**
 * Main Application Logic
 * Handles UI interactions, file uploads, and coordination
 */

class App {
    constructor() {
        this.processedResults = [];
        this.initializeElements();
        this.attachEventListeners();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Upload section
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');

        // Status section
        this.statusSection = document.getElementById('statusSection');
        this.statusText = document.getElementById('statusText');
        this.progressFill = document.getElementById('progressFill');

        // Results section
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsGrid = document.getElementById('resultsGrid');
        this.imageCount = document.getElementById('imageCount');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }

    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Browse button
        this.browseBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Download all button
        this.downloadAllBtn.addEventListener('click', () => {
            this.downloadAllAsZip();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });
    }

    /**
     * Handle file selection/drop
     * @param {FileList} files - Selected files
     */
    async handleFiles(files) {
        // Filter for image files
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );

        if (imageFiles.length === 0) {
            alert('Please select valid image files (PNG, JPG, JPEG, WebP)');
            return;
        }

        // Show status section
        this.showStatusSection();

        // Process images
        await this.processImages(imageFiles);

        // Hide status, show results
        this.hideStatusSection();
        this.showResultsSection();
    }

    /**
     * Process images with ImageProcessor
     * @param {File[]} files - Image files to process
     */
    async processImages(files) {
        this.statusText.textContent = `Processing ${files.length} image(s)...`;
        this.progressFill.style.width = '0%';

        // Progress callback
        const onProgress = (current, total) => {
            const percent = (current / total) * 100;
            this.progressFill.style.width = `${percent}%`;
            this.statusText.textContent = `Processing ${current} of ${total} image(s)...`;
        };

        // Process all images with default mode
        this.processedResults = await ImageProcessor.batchProcess(files, onProgress, 'white-to-black');

        // Filter successful results
        const successCount = this.processedResults.filter(r => r.success).length;
        console.log(`Successfully processed ${successCount} of ${files.length} images`);
    }

    /**
     * Display processed results in the grid
     */
    displayResults() {
        this.resultsGrid.innerHTML = '';
        
        const successfulResults = this.processedResults.filter(r => r.success);
        this.imageCount.textContent = successfulResults.length;

        successfulResults.forEach((result, index) => {
            const resultItem = this.createResultItem(result, index);
            this.resultsGrid.appendChild(resultItem);
        });
    }

    /**
     * Create a result item element
     * @param {Object} result - Processed result object
     * @param {number} index - Item index
     * @returns {HTMLElement}
     */
    createResultItem(result, index) {
        // Clone template
        const template = document.getElementById('resultItemTemplate');
        const clone = template.content.cloneNode(true);
        const div = clone.querySelector('.result-item');
        
        div.style.animationDelay = `${index * 0.05}s`;
        div.dataset.index = index;

        // Set images
        div.querySelector('.original-img').src = result.original;
        
        // Create converted image URL from canvas
        const initialMode = 'white-to-black';
        const initialFormat = 'webp';
        const initialQuality = 0.9;
        
        // Set initial converted image
        ImageProcessor.canvasToBlob(result.canvas, initialFormat, initialQuality).then(blob => {
            const url = URL.createObjectURL(blob);
            div.querySelector('.converted-img').src = url;
        });

        // Set filename
        div.querySelector('.image-name').textContent = ImageProcessor.generateFilename(result.originalFilename, initialFormat, initialMode);

        // Selectors and controls
        const modeSelect = div.querySelector('.mode-select');
        const formatSelect = div.querySelector('.format-select');
        const qualityControl = div.querySelector('.quality-control');
        const qualitySlider = div.querySelector('.quality-slider');
        const qualityValue = div.querySelector('.quality-value');
        const imageName = div.querySelector('.image-name');

        // Initial state - show quality for WebP
        qualityControl.classList.remove('hidden');

        // Mode change handler
        modeSelect.addEventListener('change', async (e) => {
            const mode = e.target.value;
            const format = formatSelect.value;
            const quality = qualitySlider.value / 100;
            
            // Reprocess image with new mode
            await this.reprocessImage(div, result, mode);
            
            // Update preview and filename
            this.updatePreview(div, result, mode, format, quality);
            imageName.textContent = ImageProcessor.generateFilename(result.originalFilename, format, mode);
            
            // Store current settings
            result.mode = mode;
        });

        // Format change handler
        formatSelect.addEventListener('change', (e) => {
            const mode = modeSelect.value;
            const format = e.target.value;
            const quality = qualitySlider.value / 100;
            
            // Show/hide quality control
            if (format === 'png') {
                qualityControl.classList.add('hidden');
            } else {
                qualityControl.classList.remove('hidden');
            }

            // Update preview and filename
            this.updatePreview(div, result, mode, format, quality);
            imageName.textContent = ImageProcessor.generateFilename(result.originalFilename, format, mode);
            
            // Store current settings
            result.format = format;
            result.quality = quality;
        });

        // Quality slider handler
        qualitySlider.addEventListener('input', (e) => {
            const mode = modeSelect.value;
            const quality = e.target.value / 100;
            qualityValue.textContent = e.target.value;
            
            const format = formatSelect.value;
            this.updatePreview(div, result, mode, format, quality);
            
            // Store current settings
            result.quality = quality;
        });

        // Download button handler
        const downloadBtn = div.querySelector('.download-btn');
        downloadBtn.addEventListener('click', async () => {
            const mode = modeSelect.value;
            const format = formatSelect.value;
            const quality = qualitySlider.value / 100;
            const blob = await ImageProcessor.canvasToBlob(result.canvas, format, quality);
            const filename = ImageProcessor.generateFilename(result.originalFilename, format, mode);
            ImageProcessor.downloadFile(blob, filename);
        });

        // Set initial settings in result
        result.mode = initialMode;
        result.format = initialFormat;
        result.quality = initialQuality;

        return div;
    }

    /**
     * Update preview image with new format/quality
     * @param {HTMLElement} div - Result item div
     * @param {Object} result - Processed result
     * @param {string} mode - Conversion mode
     * @param {string} format - Image format
     * @param {number} quality - Image quality (0-1)
     */
    async updatePreview(div, result, mode, format, quality) {
        try {
            const blob = await ImageProcessor.canvasToBlob(result.canvas, format, quality);
            const url = URL.createObjectURL(blob);
            const convertedImg = div.querySelector('.converted-img');
            
            // Revoke old URL if exists
            if (convertedImg.src && convertedImg.src.startsWith('blob:')) {
                URL.revokeObjectURL(convertedImg.src);
            }
            
            convertedImg.src = url;
        } catch (error) {
            console.error('Failed to update preview:', error);
        }
    }

    /**
     * Reprocess image with new conversion mode
     * @param {HTMLElement} div - Result item div
     * @param {Object} result - Processed result
     * @param {string} mode - Conversion mode
     */
    async reprocessImage(div, result, mode) {
        try {
            // Convert original data URL back to blob
            const response = await fetch(result.original);
            const blob = await response.blob();
            const file = new File([blob], result.originalFilename, { type: blob.type });
            
            // Reprocess with new mode
            const processed = await ImageProcessor.convertWhiteToBlack(file, mode);
            result.canvas = processed.canvas;
        } catch (error) {
            console.error('Failed to reprocess image:', error);
            alert('Failed to change conversion mode. Please try again.');
        }
    }

    /**
     * Download all images as ZIP
     */
    async downloadAllAsZip() {
        this.downloadAllBtn.disabled = true;
        this.downloadAllBtn.textContent = 'Creating ZIP...';

        try {
            const zipBlob = await ImageProcessor.createZip(this.processedResults);
            ImageProcessor.downloadFile(zipBlob, 'converted-logos.zip');
        } catch (error) {
            console.error('Failed to create ZIP:', error);
            alert('Failed to create ZIP file. Please try downloading images individually.');
        } finally {
            this.downloadAllBtn.disabled = false;
            this.downloadAllBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download All as ZIP
            `;
        }
    }

    /**
     * Show status section
     */
    showStatusSection() {
        this.statusSection.style.display = 'block';
        this.resultsSection.style.display = 'none';
    }

    /**
     * Hide status section
     */
    hideStatusSection() {
        this.statusSection.style.display = 'none';
    }

    /**
     * Show results section
     */
    showResultsSection() {
        this.displayResults();
        this.resultsSection.style.display = 'block';
    }

    /**
     * Reset the application
     */
    reset() {
        // Revoke blob URLs to prevent memory leaks
        const images = this.resultsGrid.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });
        
        // Clear processed results
        this.processedResults = [];
        
        // Reset file input
        this.fileInput.value = '';
        
        // Hide sections
        this.statusSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        
        // Clear results grid
        this.resultsGrid.innerHTML = '';
        
        // Reset progress
        this.progressFill.style.width = '0%';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

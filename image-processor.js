/**
 * Image Processor Module
 * Handles conversion of white/light pixels to black while preserving transparency
 */

class ImageProcessor {
    /**
     * Convert colors in an image (white to black or black to white)
     * @param {File} file - The image file to process
     * @param {string} mode - Conversion mode: 'white-to-black' or 'black-to-white'
     * @param {number} threshold - Brightness threshold (0-255) for detecting pixels to convert
     * @returns {Promise<{original: string, canvas: HTMLCanvasElement, originalFilename: string}>}
     */
    static async convertWhiteToBlack(file, mode = 'white-to-black', threshold = 200) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    try {
                        // Create canvas for processing
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Draw original image
                        ctx.drawImage(img, 0, 0);

                        // Get image data
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;

                        // Process each pixel
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];

                            // Calculate brightness (0-255)
                            const brightness = (r + g + b) / 3;

                            if (mode === 'white-to-black') {
                                // If pixel is white/light (above threshold) and not transparent
                                if (brightness >= threshold && a > 0) {
                                    // Convert to black while preserving alpha
                                    data[i] = 0;     // R
                                    data[i + 1] = 0; // G
                                    data[i + 2] = 0; // B
                                    // Keep alpha channel as is: data[i + 3] = a;
                                }
                                // Otherwise, keep the pixel as is
                            } else if (mode === 'black-to-white') {
                                // If pixel is dark (below threshold) and not transparent
                                // Use inverted threshold: 255 - threshold for dark detection
                                const darkThreshold = 255 - threshold;
                                if (brightness <= darkThreshold && a > 0) {
                                    // Convert to white while preserving alpha
                                    data[i] = 255;     // R
                                    data[i + 1] = 255; // G
                                    data[i + 2] = 255; // B
                                    // Keep alpha channel as is: data[i + 3] = a;
                                }
                                // Otherwise, keep the pixel as is
                            }
                        }

                        // Put processed image data back
                        ctx.putImageData(imageData, 0, 0);

                        // Return canvas for flexible format conversion
                        resolve({
                            original: e.target.result,
                            canvas: canvas,
                            originalFilename: file.name
                        });
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Convert canvas to blob with specified format and quality
     * @param {HTMLCanvasElement} canvas - Canvas with processed image
     * @param {string} format - Output format ('png', 'jpeg', 'webp')
     * @param {number} quality - Quality (0-1) for lossy formats
     * @returns {Promise<Blob>}
     */
    static async canvasToBlob(canvas, format = 'png', quality = 0.9) {
        return new Promise((resolve, reject) => {
            try {
                const mimeType = `image/${format}`;
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error(`Failed to convert canvas to ${format} blob`));
                    }
                }, mimeType, quality);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate output filename
     * @param {string} originalName - Original filename
     * @param {string} format - Output format ('png', 'jpeg', 'webp')
     * @param {string} mode - Conversion mode: 'white-to-black' or 'black-to-white'
     * @returns {string} New filename with appropriate suffix and correct extension
     */
    static generateFilename(originalName, format = 'png', mode = 'white-to-black') {
        const lastDot = originalName.lastIndexOf('.');
        const name = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
        const extension = format === 'jpeg' ? 'jpg' : format;
        const suffix = mode === 'black-to-white' ? '-white' : '-black';
        return `${name}${suffix}.${extension}`;
    }

    /**
     * Batch process multiple images
     * @param {File[]} files - Array of image files
     * @param {Function} progressCallback - Callback for progress updates (current, total)
     * @param {string} mode - Conversion mode: 'white-to-black' or 'black-to-white'
     * @param {number} threshold - Brightness threshold for detection
     * @returns {Promise<Array>} Array of processed results
     */
    static async batchProcess(files, progressCallback = null, mode = 'white-to-black', threshold = 200) {
        const results = [];
        const total = files.length;

        for (let i = 0; i < total; i++) {
            try {
                const result = await this.convertWhiteToBlack(files[i], mode, threshold);
                results.push({
                    success: true,
                    ...result
                });
            } catch (error) {
                console.error(`Failed to process ${files[i].name}:`, error);
                results.push({
                    success: false,
                    filename: files[i].name,
                    error: error.message
                });
            }

            // Update progress
            if (progressCallback) {
                progressCallback(i + 1, total);
            }
        }

        return results;
    }

    /**
     * Create a ZIP file from processed images
     * @param {Array} processedResults - Array of processed image results with format/quality settings
     * @returns {Promise<Blob>} ZIP file blob
     */
    static async createZip(processedResults) {
        try {
            const zip = new JSZip();
            const folder = zip.folder('converted-logos');

            // Add successful conversions to ZIP
            for (const result of processedResults) {
                if (result.success && result.canvas) {
                    try {
                        const format = result.format || 'webp';
                        const quality = result.quality || 0.9;
                        const mode = result.mode || 'white-to-black';
                        const blob = await this.canvasToBlob(result.canvas, format, quality);
                        const filename = this.generateFilename(result.originalFilename, format, mode);
                        folder.file(filename, blob);
                    } catch (error) {
                        console.error(`Failed to add ${result.originalFilename} to ZIP:`, error);
                    }
                }
            }

            // Generate ZIP
            return await zip.generateAsync({ type: 'blob' });
        } catch (error) {
            console.error('Failed to create ZIP:', error);
            throw error;
        }
    }

    /**
     * Download a single file
     * @param {Blob} blob - File blob
     * @param {string} filename - Filename for download
     */
    static downloadFile(blob, filename) {
        if (!blob || !filename) {
            console.error('Invalid blob or filename for download');
            return;
        }
        
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up the URL after a short delay
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('Failed to download file:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageProcessor;
}

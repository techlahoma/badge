/**
 * Gets a DOM element by its ID.
 * @param {string} id - The element ID
 * @returns {HTMLElement | null}
 */
function getById(id) {
    return document.getElementById(id)
}

// ============================================
// Image Transform State
// ============================================

/** Current zoom level (1.0 = cover fit) */
let imageScale = 1.0;

/** Pan offset X in pixels (relative to preview) */
let imageOffsetX = 0;

/** Pan offset Y in pixels (relative to preview) */
let imageOffsetY = 0;

/** Base scale to "cover" the preview area */
let baseCoverScale = 1.0;

/** Original image dimensions */
let naturalWidth = 0;
let naturalHeight = 0;

/** Preview container size */
const PREVIEW_SIZE = 200;

/** Canvas output size */
const CANVAS_SIZE = 500;

/**
 * Resets transform state when a new image loads.
 * Calculates the base scale needed to "cover"
 * the preview area while maintaining aspect ratio.
 * @param {HTMLImageElement} imageElement
 * @returns {void}
 */
function resetImageTransform(imageElement) {
    naturalWidth = imageElement.naturalWidth;
    naturalHeight = imageElement.naturalHeight;

    // Calculate scale to cover (fill) the preview
    // Pick the larger scale so image covers the area
    const scaleX = PREVIEW_SIZE / naturalWidth;
    const scaleY = PREVIEW_SIZE / naturalHeight;
    baseCoverScale = Math.max(scaleX, scaleY);

    // Reset to default zoom and center the image
    imageScale = 1.0;
    imageOffsetX = 0;
    imageOffsetY = 0;

    updateImagePreview();
}

/**
 * Updates the preview image CSS transform based
 * on current scale and offset values.
 * @returns {void}
 */
function updateImagePreview() {
    const portraitImage = getById('portrait-image');
    const finalScale = baseCoverScale * imageScale;

    // Calculate scaled dimensions
    const scaledWidth = naturalWidth * finalScale;
    const scaledHeight = naturalHeight * finalScale;

    // Center the image then apply offset
    const centerX = (PREVIEW_SIZE - scaledWidth) / 2;
    const centerY = (PREVIEW_SIZE - scaledHeight) / 2;

    const translateX = centerX + imageOffsetX;
    const translateY = centerY + imageOffsetY;

    portraitImage.style.transform =
        `translate(${translateX}px, ${translateY}px) ` +
        `scale(${finalScale})`;
    portraitImage.style.transformOrigin = 'top left';
}

/**
 * Clamps the pan offset so the image always
 * covers the preview area (no empty space).
 * @returns {void}
 */
function clampOffset() {
    const finalScale = baseCoverScale * imageScale;
    const scaledWidth = naturalWidth * finalScale;
    const scaledHeight = naturalHeight * finalScale;

    // How much the image overflows the preview
    const overflowX = (scaledWidth - PREVIEW_SIZE) / 2;
    const overflowY = (scaledHeight - PREVIEW_SIZE) / 2;

    // Clamp offsets so image always covers preview
    const maxOffsetX = Math.max(0, overflowX);
    const maxOffsetY = Math.max(0, overflowY);

    imageOffsetX = Math.max(-maxOffsetX,
                   Math.min(maxOffsetX, imageOffsetX));
    imageOffsetY = Math.max(-maxOffsetY,
                   Math.min(maxOffsetY, imageOffsetY));
}

/**
 * Handles mouse wheel zoom on the image preview.
 * @param {WheelEvent} event
 * @returns {void}
 */
function handleZoom(event) {
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = imageScale * zoomFactor;

    // Clamp zoom between 1x (cover) and 5x
    imageScale = Math.max(1.0, Math.min(5.0, newScale));

    clampOffset();
    updateImagePreview();
}

/**
 * Sets up drag-to-pan functionality on the
 * image preview container.
 * @returns {void}
 */
function setupPanHandlers() {
    const previewContainer = getById('image-preview');
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    previewContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        previewContainer.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        imageOffsetX += deltaX;
        imageOffsetY += deltaY;

        clampOffset();
        updateImagePreview();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        previewContainer.style.cursor = 'grab';
    });

    // Touch support for mobile
    previewContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;

        const deltaX = e.touches[0].clientX - lastX;
        const deltaY = e.touches[0].clientY - lastY;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;

        imageOffsetX += deltaX;
        imageOffsetY += deltaY;

        clampOffset();
        updateImagePreview();
    }, { passive: true });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

/**
 * Escapes HTML special characters to prevent
 * XSS attacks when inserting user input.
 * @param {string} str - The raw string to sanitize
 * @returns {string} The escaped HTML-safe string
 */
function sanitizeHTML(str) {
    return str.replaceAll('&', '&amp;')
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;')
              .replaceAll('"', '&quot;')
              .replaceAll("'", '&#39;');
}

/**
 * Creates a new Image and waits for it to load.
 * @param {string} src - The image source URL
 * @returns {Promise<HTMLImageElement>}
 *   Resolves with the loaded image element
 * @throws {string} Rejects with error message
 *   if image fails to load
 */
function imageWithLoadedSrc(src) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img);
        img.onerror = () => reject(`Error loading image ${src}`);
        img.src = src;
    })
}

/**
 * Recursively inlines all computed styles on an
 * element and its children. Required for SVG
 * serialization since external CSS won't be
 * included when converting to data URI.
 * @param {Element} element - The DOM element to
 *   inline styles for
 * @returns {void}
 */
function inlineStyles(element) {
    const computedStyle = getComputedStyle(element);
    let style = '';
    for (let i = 0; i < computedStyle.length; i++) {
        const prop = computedStyle[i];
        style += `${prop}: ${computedStyle.getPropertyValue(prop)}; `;
    }
    element.setAttribute('style', style);

    const children = element.children;
    for (let i = 0; i < children.length; i++) {
        inlineStyles(children[i]);
    }
}

/**
 * Serializes an SVG element to a string with all
 * styles inlined for standalone rendering.
 * @param {SVGElement} svg - The SVG element
 * @returns {string} The serialized SVG markup
 */
function getSvgString(svg) {
    inlineStyles(svg);
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
}

/**
 * Renders the badge by compositing the portrait
 * image and SVG overlay onto the canvas.
 * Applies current zoom and pan transforms.
 * @returns {Promise<void>}
 */
async function draw() {
    const canvas = getById('canvas-image');
    const ctx = canvas.getContext('2d');
    const imagePreview = getById('portrait-image');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const image = await imageWithLoadedSrc(imagePreview.src);

    // Scale factor from preview to canvas
    const previewToCanvas = CANVAS_SIZE / PREVIEW_SIZE;

    // Calculate final scale and position for canvas
    const finalScale = baseCoverScale * imageScale;
    const canvasScale = finalScale * previewToCanvas;

    const scaledWidth = naturalWidth * finalScale;
    const scaledHeight = naturalHeight * finalScale;

    // Center position + offset, scaled to canvas
    const centerX = (PREVIEW_SIZE - scaledWidth) / 2;
    const centerY = (PREVIEW_SIZE - scaledHeight) / 2;

    const drawX = (centerX + imageOffsetX) * previewToCanvas;
    const drawY = (centerY + imageOffsetY) * previewToCanvas;
    const drawWidth = naturalWidth * canvasScale;
    const drawHeight = naturalHeight * canvasScale;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
 
    const svgStr = getSvgString(getById('overlay-svg'));

    // Use encodeURIComponent for Unicode support (emojis)
    const svgImage = await imageWithLoadedSrc(
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(svgStr)
    );
    ctx.drawImage(svgImage, 0, 0, canvas.width, canvas.height);
}

/**
 * Draws the final badge and triggers a PNG
 * download with a default filename.
 * @returns {Promise<void>}
 */
async function download() {
    await draw();
    const canvas = getById('canvas-image');
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'linkedin-profile.png';
    link.click();
}

getById('portrait-image-upload').addEventListener('change', function(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const portraitImage = getById('portrait-image');
        portraitImage.onload = function() {
            resetImageTransform(portraitImage);
        };
        portraitImage.src = e.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);
})

getById('badge-text-input').addEventListener('input', () => {
    const badgeText = getById('badge-text-input').value.toUpperCase();
    getById('overlay-text-path').innerHTML = `🦬${badgeText}`;
});

getById('badge-bg-color-input').addEventListener('input', () => {
    const badgeColor = getById('badge-bg-color-input').value;
    getById('left-bottom-stop').style.stopColor = badgeColor;
});

getById('badge-text-color-input').addEventListener('input', () => {
    const badgeTextColor = getById('badge-text-color-input').value;
    getById('overlay-text-path').style.fill = badgeTextColor;
});

getById('upload-button').addEventListener('click', () => {
    getById('portrait-image-upload').click();
})

getById('download-button').addEventListener('click', () => {
    download();
});

// Set up zoom via mouse wheel
getById('image-preview').addEventListener('wheel', handleZoom, {
    passive: false
});

// Set up drag-to-pan
setupPanHandlers();

// Initialize transform for placeholder image
const placeholderImage = getById('portrait-image');
if (placeholderImage.complete) {
    resetImageTransform(placeholderImage);
} else {
    placeholderImage.onload = function() {
        resetImageTransform(placeholderImage);
    };
}

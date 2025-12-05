/**
 * Gets a DOM element by its ID.
 * @param {string} id - The element ID
 * @returns {HTMLElement | null}
 */
function getById(id) {
    return document.getElementById(id)
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
 * @returns {Promise<void>}
 */
async function draw() {
    const canvas = getById('canvas-image');
    const ctx = canvas.getContext('2d');
    const imagePreview = getById('portrait-image');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const image = await imageWithLoadedSrc(imagePreview.src)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
 
    const svgStr = getSvgString(getById('overlay-svg'));

    const svgImage = await imageWithLoadedSrc('data:image/svg+xml;base64,' + btoa(svgStr))
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
    const reader = new FileReader()
    reader.onload = function(e) {
        getById('portrait-image').src = e.target.result
    }
    reader.readAsDataURL(event.target.files[0])
})

getById('badge-text-input').addEventListener('input', () => {
    getById('overlay-text-path').innerHTML = sanitizeHTML(getById('badge-text-input').value);
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
})

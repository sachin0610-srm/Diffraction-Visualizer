/**
 * color.js — Wavelength-to-Color Mapping
 * 
 * Converts visible light wavelengths (380–700 nm) to RGB colors
 * using a physically-motivated approximation of the CIE color matching functions.
 */

/**
 * Convert wavelength in nm to an [R, G, B] triplet (0–255).
 * Based on Dan Bruton's approximation.
 * 
 * @param {number} nm - wavelength in nanometers (380–700)
 * @returns {[number, number, number]} RGB array
 */
export function wavelengthToRGB(nm) {
    let r, g, b;

    if (nm >= 380 && nm < 440) {
        r = -(nm - 440) / (440 - 380);
        g = 0;
        b = 1;
    } else if (nm >= 440 && nm < 490) {
        r = 0;
        g = (nm - 440) / (490 - 440);
        b = 1;
    } else if (nm >= 490 && nm < 510) {
        r = 0;
        g = 1;
        b = -(nm - 510) / (510 - 490);
    } else if (nm >= 510 && nm < 580) {
        r = (nm - 510) / (580 - 510);
        g = 1;
        b = 0;
    } else if (nm >= 580 && nm < 645) {
        r = 1;
        g = -(nm - 645) / (645 - 580);
        b = 0;
    } else if (nm >= 645 && nm <= 700) {
        r = 1;
        g = 0;
        b = 0;
    } else {
        r = 0; g = 0; b = 0;
    }

    // Intensity fall-off at edges of visible spectrum
    let factor;
    if (nm >= 380 && nm < 420) {
        factor = 0.3 + 0.7 * (nm - 380) / (420 - 380);
    } else if (nm >= 420 && nm <= 645) {
        factor = 1.0;
    } else if (nm > 645 && nm <= 700) {
        factor = 0.3 + 0.7 * (700 - nm) / (700 - 645);
    } else {
        factor = 0;
    }

    // Gamma correction
    const gamma = 0.8;
    r = Math.round(255 * Math.pow(r * factor, gamma));
    g = Math.round(255 * Math.pow(g * factor, gamma));
    b = Math.round(255 * Math.pow(b * factor, gamma));

    return [r, g, b];
}

/**
 * Convert wavelength to hex color string.
 * @param {number} nm
 * @returns {string} e.g. "#ff6600"
 */
export function wavelengthToHex(nm) {
    const [r, g, b] = wavelengthToRGB(nm);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert wavelength to CSS rgba string with optional alpha.
 * @param {number} nm
 * @param {number} alpha - opacity 0–1
 * @returns {string}
 */
export function wavelengthToRGBA(nm, alpha = 1) {
    const [r, g, b] = wavelengthToRGB(nm);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate a Plotly-compatible colorscale from black → wavelength color.
 * @param {number} nm
 * @returns {Array<[number, string]>}
 */
export function intensityColorscale(nm) {
    const [r, g, b] = wavelengthToRGB(nm);
    return [
        [0, 'rgb(0, 0, 0)'],
        [0.15, `rgb(${Math.round(r * 0.15)}, ${Math.round(g * 0.15)}, ${Math.round(b * 0.15)})`],
        [0.4, `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`],
        [0.7, `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.7)})`],
        [1, `rgb(${r}, ${g}, ${b})`]
    ];
}

/**
 * Generate a rainbow spectrum gradient CSS string for the wavelength slider.
 * @returns {string}
 */
export function spectrumGradient() {
    const stops = [];
    for (let nm = 380; nm <= 700; nm += 20) {
        const pct = ((nm - 380) / (700 - 380)) * 100;
        stops.push(`${wavelengthToHex(nm)} ${pct.toFixed(1)}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
}

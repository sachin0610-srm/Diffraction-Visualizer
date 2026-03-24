/**
 * physics.js — Diffraction Physics Engine
 * 
 * Implements single-slit and multi-slit (grating) diffraction intensity
 * calculations with numerically stable sinc functions.
 */

/**
 * Numerically stable sinc: sin(x)/x, returning 1.0 at x≈0
 */
export function sinc(x) {
    if (Math.abs(x) < 1e-10) return 1.0;
    return Math.sin(x) / x;
}

/**
 * Single-slit diffraction intensity.
 * I(θ) = I₀ [sin(β)/β]²
 * β = (π a sinθ) / λ
 * 
 * @param {number} theta - angle in radians
 * @param {number} a     - slit width in meters
 * @param {number} lambda - wavelength in meters
 * @returns {number} normalized intensity [0,1]
 */
export function singleSlitIntensity(theta, a, lambda) {
    const beta = (Math.PI * a * Math.sin(theta)) / lambda;
    return sinc(beta) ** 2;
}

/**
 * Multi-slit (grating) interference factor.
 * G(θ) = [sin(Nδ/2) / (N sin(δ/2))]²
 * δ = (2π d sinθ) / λ
 * 
 * @param {number} theta  - angle in radians
 * @param {number} d      - slit spacing in meters
 * @param {number} N      - number of slits
 * @param {number} lambda - wavelength in meters
 * @returns {number} interference factor [0,1]
 */
export function multiSlitFactor(theta, d, N, lambda) {
    if (N <= 1) return 1.0;
    const delta = (2 * Math.PI * d * Math.sin(theta)) / lambda;
    const halfDelta = delta / 2;
    const denominator = N * Math.sin(halfDelta);
    
    if (Math.abs(denominator) < 1e-10) {
        // L'Hôpital limit: N*cos(Nδ/2) / (N*cos(δ/2)) → ±1
        return 1.0;
    }
    const ratio = Math.sin(N * halfDelta) / denominator;
    return ratio * ratio;
}

/**
 * Full diffraction intensity (single or multi-slit).
 * 
 * @param {number} theta  - angle in radians
 * @param {Object} params - { a, d, N, lambda }
 * @returns {number} intensity [0,1]
 */
export function diffractionIntensity(theta, params) {
    const { a, d, N, lambda } = params;
    const envelope = singleSlitIntensity(theta, a, lambda);
    if (N <= 1) return envelope;
    return envelope * multiSlitFactor(theta, d, N, lambda);
}

/**
 * Compute a 1D diffraction pattern over an angle range.
 * 
 * @param {Object} params - { a, d, N, lambda, thetaMax, numPoints }
 * @returns {{ theta: number[], intensity: number[] }}
 */
export function computePattern1D(params) {
    const { a, d, N, lambda, thetaMax = Math.PI / 6, numPoints = 1000 } = params;
    const theta = [];
    const intensity = [];

    for (let i = 0; i < numPoints; i++) {
        const t = -thetaMax + (2 * thetaMax * i) / (numPoints - 1);
        theta.push(t);
        intensity.push(diffractionIntensity(t, { a, d, N, lambda }));
    }

    return { theta, intensity };
}

/**
 * Compute 2D diffraction pattern for 3D surface visualization.
 * Models vertical single-slit and horizontal multi-slit.
 * 
 * @param {Object} params - { a, d, N, lambda, thetaMax, numPoints }
 * @returns {{ x: number[], y: number[], z: number[][] }}
 */
export function computePattern2D(params) {
    const { a, d, N, lambda, thetaMax = Math.PI / 12, numPoints = 150 } = params;
    const angles = [];

    for (let i = 0; i < numPoints; i++) {
        angles.push(-thetaMax + (2 * thetaMax * i) / (numPoints - 1));
    }

    const z = [];
    for (let iy = 0; iy < numPoints; iy++) {
        const row = [];
        const thetaY = angles[iy];
        // Vertical direction: single slit envelope
        const envY = singleSlitIntensity(thetaY, a, lambda);

        for (let ix = 0; ix < numPoints; ix++) {
            const thetaX = angles[ix];
            // Horizontal direction: full diffraction (envelope + grating)
            const envX = singleSlitIntensity(thetaX, a, lambda);
            const grating = N > 1 ? multiSlitFactor(thetaX, d, N, lambda) : 1.0;
            row.push(envY * envX * grating);
        }
        z.push(row);
    }

    return { x: angles, y: angles, z };
}

/**
 * Convert angle array to screen position (mm) given screen distance L.
 * x = L * tan(θ) ≈ L * θ for small angles
 * 
 * @param {number[]} theta - angles in radians
 * @param {number} L - screen distance in meters
 * @returns {number[]} positions in mm
 */
export function thetaToScreenPosition(theta, L) {
    return theta.map(t => L * Math.tan(t) * 1000); // convert m to mm
}

/**
 * Find local maxima indices in an intensity array.
 * @param {number[]} intensity
 * @param {number} minProminence - minimum intensity to qualify
 * @returns {number[]} indices of maxima
 */
export function findMaxima(intensity, minProminence = 0.005) {
    const maxima = [];
    for (let i = 1; i < intensity.length - 1; i++) {
        if (intensity[i] > intensity[i - 1] &&
            intensity[i] > intensity[i + 1] &&
            intensity[i] >= minProminence) {
            maxima.push(i);
        }
    }
    return maxima;
}

/**
 * Find local minima indices in an intensity array.
 * @param {number[]} intensity
 * @param {number} maxVal - maximum intensity to qualify as minimum
 * @returns {number[]} indices of minima
 */
export function findMinima(intensity, maxVal = 0.05) {
    const minima = [];
    for (let i = 1; i < intensity.length - 1; i++) {
        if (intensity[i] < intensity[i - 1] &&
            intensity[i] < intensity[i + 1] &&
            intensity[i] <= maxVal) {
            minima.push(i);
        }
    }
    return minima;
}

/**
 * Compute phasor diagram data for N slits at a given angle.
 * Returns an array of cumulative phasor tip positions.
 * 
 * @param {Object} params - { d, N, lambda, theta }
 * @returns {{ x: number[], y: number[], amplitude: number }}
 */
export function computePhasors(params) {
    const { d, N, lambda, theta } = params;
    const delta = (2 * Math.PI * d * Math.sin(theta)) / lambda;

    let cx = 0, cy = 0;
    const x = [0], y = [0];

    for (let i = 0; i < N; i++) {
        const angle = i * delta;
        cx += Math.cos(angle);
        cy += Math.sin(angle);
        x.push(cx);
        y.push(cy);
    }

    const amplitude = Math.sqrt(cx * cx + cy * cy) / N;
    return { x, y, amplitude };
}

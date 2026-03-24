/**
 * equations.js — Dynamic LaTeX Equation Display
 * 
 * Renders single-slit and multi-slit diffraction equations
 * with live parameter substitution using MathJax.
 */

/**
 * Build LaTeX string for single-slit diffraction.
 */
function singleSlitLatex(params) {
    const nm = (params.lambda * 1e9).toFixed(0);
    const aUm = (params.a * 1e6).toFixed(2);

    return String.raw`
        I(\theta) = I_0 \left[\frac{\sin\beta}{\beta}\right]^2
        \qquad \beta = \frac{\pi\, a\, \sin\theta}{\lambda}
        \qquad \Rightarrow \quad
        \beta = \frac{\pi \times ${aUm}\,\mu\text{m} \times \sin\theta}{${nm}\,\text{nm}}
    `;
}

/**
 * Build LaTeX string for multi-slit (grating) diffraction.
 */
function multiSlitLatex(params) {
    const nm = (params.lambda * 1e9).toFixed(0);
    const aUm = (params.a * 1e6).toFixed(2);
    const dUm = (params.d * 1e6).toFixed(2);
    const N = params.N;

    return String.raw`
        I(\theta) = I_0 
        \underbrace{\left[\frac{\sin\beta}{\beta}\right]^2}_{\text{envelope}}
        \times
        \underbrace{\left[\frac{\sin\!\left(\frac{N\delta}{2}\right)}{N\sin\!\left(\frac{\delta}{2}\right)}\right]^2}_{\text{interference}}
        \qquad
        \begin{cases}
            \beta = \frac{\pi \times ${aUm}\,\mu\text{m} \times \sin\theta}{${nm}\,\text{nm}} \\[6pt]
            \delta = \frac{2\pi \times ${dUm}\,\mu\text{m} \times \sin\theta}{${nm}\,\text{nm}} \\[4pt]
            N = ${N}
        \end{cases}
    `;
}

/**
 * Update the equation display panel with current parameters.
 * @param {Object} params - current simulation parameters
 * @param {HTMLElement} container - the equation display element
 */
export function updateEquationDisplay(params, container) {
    const latex = params.N > 1 ? multiSlitLatex(params) : singleSlitLatex(params);
    container.innerHTML = `\\[${latex}\\]`;

    // Re-typeset MathJax
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([container]).catch(err => console.warn('MathJax error:', err));
    }
}

/**
 * app.js — Application Entry Point
 * 
 * Wires together physics, color, plots, controls, and equations.
 * Manages global state and the update loop.
 */

import { computePattern1D, computePattern2D, computePhasors } from './physics.js';
import { wavelengthToHex, wavelengthToRGBA, spectrumGradient } from './color.js';
import { render2DPlot, render3DSurface, renderComparison, renderPhasor, exportPlot } from './plots.js';
import { updateEquationDisplay } from './equations.js';

// ─── Global State ───────────────────────────────────────────────
const state = {
    // Primary parameters
    lambda: 550e-9,   // wavelength (m)
    a: 2e-6,          // slit width (m)
    d: 8e-6,          // slit spacing (m)
    N: 1,             // number of slits
    L: 1.0,           // screen distance (m)

    // View state
    activeTab: '2d',
    mode: 'single',   // 'single' or 'grating'
    comparisonEnabled: false,
    educationalOpen: false,

    // Comparison (set B) parameters
    lambdaB: 650e-9,
    aB: 2e-6,
    dB: 8e-6,
    NB: 2,
    LB: 1.0,

    // Phasor angle
    phasorTheta: 0.05,

    // Animation
    updatePending: false,
};

// ─── DOM References ─────────────────────────────────────────────
let DOM = {};

function cacheDom() {
    DOM = {
        // Sliders
        wavelengthSlider: document.getElementById('wavelength-slider'),
        slitWidthSlider: document.getElementById('slit-width-slider'),
        slitSpacingSlider: document.getElementById('slit-spacing-slider'),
        numSlitsSlider: document.getElementById('num-slits-slider'),
        screenDistSlider: document.getElementById('screen-dist-slider'),
        phasorAngleSlider: document.getElementById('phasor-angle-slider'),

        // Readouts
        wavelengthVal: document.getElementById('wavelength-val'),
        slitWidthVal: document.getElementById('slit-width-val'),
        slitSpacingVal: document.getElementById('slit-spacing-val'),
        numSlitsVal: document.getElementById('num-slits-val'),
        screenDistVal: document.getElementById('screen-dist-val'),
        phasorAngleVal: document.getElementById('phasor-angle-val'),

        // Comparison sliders
        wavelengthSliderB: document.getElementById('wavelength-slider-b'),
        slitWidthSliderB: document.getElementById('slit-width-slider-b'),
        slitSpacingSliderB: document.getElementById('slit-spacing-slider-b'),
        numSlitsSliderB: document.getElementById('num-slits-slider-b'),

        wavelengthValB: document.getElementById('wavelength-val-b'),
        slitWidthValB: document.getElementById('slit-width-val-b'),
        slitSpacingValB: document.getElementById('slit-spacing-val-b'),
        numSlitsValB: document.getElementById('num-slits-val-b'),

        // Containers
        plotContainer: document.getElementById('plot-2d'),
        surfaceContainer: document.getElementById('plot-3d'),
        comparisonContainer: document.getElementById('plot-comparison'),
        phasorContainer: document.getElementById('plot-phasor'),
        equationDisplay: document.getElementById('equation-display'),

        // Tabs
        tabButtons: document.querySelectorAll('.tab-btn'),
        tabPanels: document.querySelectorAll('.tab-panel'),

        // Buttons / toggles
        modeToggle: document.getElementById('mode-toggle'),
        modeLabel: document.getElementById('mode-label'),
        comparisonToggle: document.getElementById('comparison-toggle'),
        exportBtn: document.getElementById('export-btn'),
        eduToggle: document.getElementById('edu-toggle'),
        eduOverlay: document.getElementById('edu-overlay'),
        eduClose: document.getElementById('edu-close'),

        // Grating controls group
        gratingControls: document.getElementById('grating-controls'),
        comparisonControls: document.getElementById('comparison-controls'),
        phasorControls: document.getElementById('phasor-controls'),

        // Color swatch
        wavelengthSwatch: document.getElementById('wavelength-swatch'),
        wavelengthSwatchB: document.getElementById('wavelength-swatch-b'),

        // Header accent
        headerAccent: document.getElementById('header-accent'),
    };
}

// ─── Slider Binding ─────────────────────────────────────────────
function bindSliders() {
    const bind = (slider, valEl, stateKey, transform, format) => {
        if (!slider) return;
        slider.addEventListener('input', () => {
            const raw = parseFloat(slider.value);
            state[stateKey] = transform(raw);
            valEl.textContent = format(raw);
            scheduleUpdate();
        });
        // Init readout
        valEl.textContent = format(parseFloat(slider.value));
    };

    bind(DOM.wavelengthSlider, DOM.wavelengthVal, 'lambda',
        v => v * 1e-9, v => `${v.toFixed(0)} nm`);
    bind(DOM.slitWidthSlider, DOM.slitWidthVal, 'a',
        v => v * 1e-6, v => `${v.toFixed(2)} μm`);
    bind(DOM.slitSpacingSlider, DOM.slitSpacingVal, 'd',
        v => v * 1e-6, v => `${v.toFixed(1)} μm`);
    bind(DOM.numSlitsSlider, DOM.numSlitsVal, 'N',
        v => Math.round(v), v => `${Math.round(v)}`);
    bind(DOM.screenDistSlider, DOM.screenDistVal, 'L',
        v => v, v => `${v.toFixed(2)} m`);
    bind(DOM.phasorAngleSlider, DOM.phasorAngleVal, 'phasorTheta',
        v => v * Math.PI / 180, v => `${v.toFixed(2)}°`);

    // Comparison sliders (set B)
    bind(DOM.wavelengthSliderB, DOM.wavelengthValB, 'lambdaB',
        v => v * 1e-9, v => `${v.toFixed(0)} nm`);
    bind(DOM.slitWidthSliderB, DOM.slitWidthValB, 'aB',
        v => v * 1e-6, v => `${v.toFixed(2)} μm`);
    bind(DOM.slitSpacingSliderB, DOM.slitSpacingValB, 'dB',
        v => v * 1e-6, v => `${v.toFixed(1)} μm`);
    bind(DOM.numSlitsSliderB, DOM.numSlitsValB, 'NB',
        v => Math.round(v), v => `${Math.round(v)}`);
}

// ─── UI Controls ────────────────────────────────────────────────
function bindControls() {
    // Mode toggle
    DOM.modeToggle.addEventListener('change', () => {
        state.mode = DOM.modeToggle.checked ? 'grating' : 'single';
        if (state.mode === 'single') {
            state.N = 1;
            DOM.numSlitsSlider.value = 1;
            DOM.numSlitsVal.textContent = '1';
        } else {
            state.N = parseInt(DOM.numSlitsSlider.value);
            if (state.N < 2) {
                state.N = 2;
                DOM.numSlitsSlider.value = 2;
                DOM.numSlitsVal.textContent = '2';
            }
        }
        DOM.modeLabel.textContent = state.mode === 'grating' ? 'Multi-Slit Grating' : 'Single Slit';
        DOM.gratingControls.classList.toggle('hidden', state.mode === 'single');
        scheduleUpdate();
    });

    // Comparison toggle
    DOM.comparisonToggle.addEventListener('change', () => {
        state.comparisonEnabled = DOM.comparisonToggle.checked;
        DOM.comparisonControls.classList.toggle('hidden', !state.comparisonEnabled);
        // Switch to comparison tab if enabled
        if (state.comparisonEnabled) switchTab('comparison');
        scheduleUpdate();
    });

    // Tab switching
    DOM.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Export
    DOM.exportBtn.addEventListener('click', () => {
        const activeContainerId = `plot-${state.activeTab}`;
        exportPlot(activeContainerId);
    });

    // Education overlay
    DOM.eduToggle.addEventListener('click', () => {
        DOM.eduOverlay.classList.add('visible');
    });
    DOM.eduClose.addEventListener('click', () => {
        DOM.eduOverlay.classList.remove('visible');
    });
    DOM.eduOverlay.addEventListener('click', e => {
        if (e.target === DOM.eduOverlay) DOM.eduOverlay.classList.remove('visible');
    });
}

function switchTab(tab) {
    state.activeTab = tab;
    DOM.tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    DOM.tabPanels.forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
    DOM.phasorControls.classList.toggle('hidden', tab !== 'phasor');
    scheduleUpdate();
}

// ─── Update Scheduling ─────────────────────────────────────────
function scheduleUpdate() {
    if (state.updatePending) return;
    state.updatePending = true;
    requestAnimationFrame(() => {
        update();
        state.updatePending = false;
    });
}

// ─── Core Update ────────────────────────────────────────────────
function update() {
    const params = {
        a: state.a,
        d: state.d,
        N: state.mode === 'single' ? 1 : state.N,
        lambda: state.lambda,
        L: state.L,
        thetaMax: Math.PI / 6,
        numPoints: 1200,
    };

    // Update wavelength visual indicators
    const nm = state.lambda * 1e9;
    const hex = wavelengthToHex(nm);
    const rgba = wavelengthToRGBA(nm, 0.3);
    document.documentElement.style.setProperty('--accent-color', hex);
    document.documentElement.style.setProperty('--accent-glow', rgba);
    if (DOM.wavelengthSwatch) DOM.wavelengthSwatch.style.background = hex;
    if (DOM.headerAccent) DOM.headerAccent.style.background = `linear-gradient(90deg, transparent, ${hex}, transparent)`;

    // Apply spectrum gradient to wavelength slider track
    if (DOM.wavelengthSlider) {
        DOM.wavelengthSlider.style.setProperty('--slider-gradient', spectrumGradient());
    }

    // Comparison set B visual indicators
    if (state.comparisonEnabled) {
        const nmB = state.lambdaB * 1e9;
        const hexB = wavelengthToHex(nmB);
        if (DOM.wavelengthSwatchB) DOM.wavelengthSwatchB.style.background = hexB;
    }

    // Render active tab
    switch (state.activeTab) {
        case '2d': {
            const data = computePattern1D(params);
            render2DPlot(data, params, DOM.plotContainer);
            break;
        }
        case '3d': {
            const data2D = computePattern2D({
                ...params,
                thetaMax: Math.PI / 12,
                numPoints: 120,
            });
            render3DSurface(data2D, params, DOM.surfaceContainer);
            break;
        }
        case 'comparison': {
            const dataA = computePattern1D(params);
            const paramsB = {
                a: state.aB,
                d: state.dB,
                N: state.NB,
                lambda: state.lambdaB,
                L: state.LB,
                thetaMax: Math.PI / 6,
                numPoints: 1200,
            };
            const dataB = computePattern1D(paramsB);
            renderComparison(dataA, dataB, params, paramsB, DOM.comparisonContainer);
            break;
        }
        case 'phasor': {
            const phasorParams = {
                d: state.d,
                N: Math.max(state.N, 2),
                lambda: state.lambda,
                theta: state.phasorTheta,
                phasorTheta: state.phasorTheta,
            };
            const phasorData = computePhasors(phasorParams);
            renderPhasor(phasorData, phasorParams, DOM.phasorContainer);
            break;
        }
    }

    // Update equation display
    updateEquationDisplay(params, DOM.equationDisplay);
}

// ─── Initialization ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    bindSliders();
    bindControls();

    // Set initial mode UI
    DOM.gratingControls.classList.add('hidden');
    DOM.comparisonControls.classList.add('hidden');
    DOM.phasorControls.classList.add('hidden');

    // Initial render
    update();
});

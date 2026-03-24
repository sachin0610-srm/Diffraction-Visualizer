/**
 * plots.js — Plotly-based Scientific Visualizations
 * 
 * Renders 2D intensity plots, 3D surface/heatmap, comparison views,
 * and phasor diagrams with publication-quality styling.
 */

import { wavelengthToHex, wavelengthToRGBA, intensityColorscale } from './color.js';
import { findMaxima, findMinima, thetaToScreenPosition } from './physics.js';

/** Shared dark Plotly layout base */
function baseDarkLayout(title = '') {
    return {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(10, 12, 20, 0.85)',
        font: { family: 'Inter, sans-serif', color: '#c8ccd4', size: 12 },
        title: { text: title, font: { size: 16, color: '#e0e4ec' }, x: 0.5 },
        margin: { l: 60, r: 30, t: 50, b: 55 },
        autosize: true,
    };
}

/**
 * Render the 2D intensity-vs-angle chart.
 */
export function render2DPlot(data, params, container) {
    const { theta, intensity } = data;
    const { lambda, a, d, N, L } = params;
    const nm = lambda * 1e9;
    const color = wavelengthToHex(nm);
    const colorFaint = wavelengthToRGBA(nm, 0.15);
    const screenPos = thetaToScreenPosition(theta, L);
    const thetaDeg = theta.map(t => (t * 180) / Math.PI);

    // Main trace
    const trace = {
        x: thetaDeg,
        y: intensity,
        type: 'scatter',
        mode: 'lines',
        line: { color, width: 2.5, shape: 'spline' },
        fill: 'tozeroy',
        fillcolor: colorFaint,
        name: N > 1 ? `N=${N} Grating` : 'Single Slit',
        customdata: screenPos.map((p, i) => [p.toFixed(2), intensity[i].toFixed(4)]),
        hovertemplate: 'θ = %{x:.2f}°<br>I/I₀ = %{customdata[1]}<br>Screen: %{customdata[0]} mm<extra></extra>',
    };

    // Annotations for maxima & minima
    const annotations = [];
    const shapes = [];

    const maximaIdx = findMaxima(intensity, 0.02);
    const minimaIdx = findMinima(intensity, 0.02);

    // Mark principal maxima (top 15)
    const sortedMaxima = maximaIdx.sort((a, b) => intensity[b] - intensity[a]).slice(0, 15);
    sortedMaxima.forEach(i => {
        annotations.push({
            x: thetaDeg[i], y: intensity[i],
            text: '▼', showarrow: false,
            font: { size: 10, color: '#ffd700' },
            yshift: 10,
        });
    });

    // Mark minima
    minimaIdx.slice(0, 10).forEach(i => {
        shapes.push({
            type: 'line',
            x0: thetaDeg[i], x1: thetaDeg[i],
            y0: 0, y1: 0.08,
            line: { color: 'rgba(255,80,80,0.4)', width: 1, dash: 'dot' },
        });
    });

    const layout = {
        ...baseDarkLayout('Diffraction Intensity Pattern'),
        xaxis: {
            title: { text: 'Angle θ (degrees)', font: { size: 13 } },
            gridcolor: 'rgba(255,255,255,0.06)',
            zerolinecolor: 'rgba(255,255,255,0.15)',
            tickfont: { size: 11 },
        },
        yaxis: {
            title: { text: 'Normalized Intensity  I/I₀', font: { size: 13 } },
            gridcolor: 'rgba(255,255,255,0.06)',
            zerolinecolor: 'rgba(255,255,255,0.15)',
            range: [0, 1.08],
            tickfont: { size: 11 },
        },
        annotations,
        shapes,
        showlegend: false,
    };

    Plotly.react(container, [trace], layout, { responsive: true, displaylogo: false });
}

/**
 * Render the 3D surface / heatmap visualization.
 */
export function render3DSurface(data, params, container) {
    const { x, y, z } = data;
    const nm = params.lambda * 1e9;
    const colorscale = intensityColorscale(nm);

    const xDeg = x.map(t => (t * 180) / Math.PI);
    const yDeg = y.map(t => (t * 180) / Math.PI);

    const trace = {
        x: xDeg, y: yDeg, z,
        type: 'surface',
        colorscale,
        showscale: true,
        colorbar: {
            title: { text: 'I/I₀', font: { size: 12, color: '#c8ccd4' } },
            tickfont: { size: 10, color: '#a0a8b8' },
            len: 0.6,
        },
        contours: {
            z: { show: true, usecolormap: true, highlightcolor: '#fff', project: { z: false } }
        },
        lighting: {
            ambient: 0.6, diffuse: 0.5, specular: 0.3, roughness: 0.5,
        },
        hovertemplate: 'θx = %{x:.1f}°<br>θy = %{y:.1f}°<br>I/I₀ = %{z:.4f}<extra></extra>',
    };

    const layout = {
        ...baseDarkLayout('2D Diffraction Pattern'),
        scene: {
            xaxis: { title: 'θ_x (°)', gridcolor: 'rgba(255,255,255,0.08)', color: '#a0a8b8' },
            yaxis: { title: 'θ_y (°)', gridcolor: 'rgba(255,255,255,0.08)', color: '#a0a8b8' },
            zaxis: { title: 'I/I₀', gridcolor: 'rgba(255,255,255,0.08)', color: '#a0a8b8', range: [0, 1] },
            bgcolor: 'rgba(10, 12, 20, 0.9)',
            camera: { eye: { x: 1.6, y: 1.6, z: 1.2 } },
        },
        margin: { l: 0, r: 0, t: 50, b: 0 },
    };

    Plotly.react(container, [trace], layout, { responsive: true, displaylogo: false });
}

/**
 * Render side-by-side comparison of two parameter sets.
 */
export function renderComparison(dataA, dataB, paramsA, paramsB, container) {
    const nmA = paramsA.lambda * 1e9;
    const nmB = paramsB.lambda * 1e9;
    const colorA = wavelengthToHex(nmA);
    const colorB = wavelengthToHex(nmB);
    const thetaDegA = dataA.theta.map(t => (t * 180) / Math.PI);
    const thetaDegB = dataB.theta.map(t => (t * 180) / Math.PI);

    const labelA = paramsA.N > 1
        ? `Set A: λ=${nmA}nm, a=${(paramsA.a*1e6).toFixed(1)}μm, d=${(paramsA.d*1e6).toFixed(1)}μm, N=${paramsA.N}`
        : `Set A: λ=${nmA}nm, a=${(paramsA.a*1e6).toFixed(1)}μm (single)`;
    const labelB = paramsB.N > 1
        ? `Set B: λ=${nmB}nm, a=${(paramsB.a*1e6).toFixed(1)}μm, d=${(paramsB.d*1e6).toFixed(1)}μm, N=${paramsB.N}`
        : `Set B: λ=${nmB}nm, a=${(paramsB.a*1e6).toFixed(1)}μm (single)`;

    const traceA = {
        x: thetaDegA, y: dataA.intensity,
        type: 'scatter', mode: 'lines',
        line: { color: colorA, width: 2.5 },
        name: labelA,
        fill: 'tozeroy',
        fillcolor: wavelengthToRGBA(nmA, 0.12),
    };

    const traceB = {
        x: thetaDegB, y: dataB.intensity,
        type: 'scatter', mode: 'lines',
        line: { color: colorB, width: 2.5, dash: 'dash' },
        name: labelB,
        fill: 'tozeroy',
        fillcolor: wavelengthToRGBA(nmB, 0.08),
    };

    const layout = {
        ...baseDarkLayout('Comparison Mode'),
        xaxis: {
            title: { text: 'Angle θ (degrees)', font: { size: 13 } },
            gridcolor: 'rgba(255,255,255,0.06)',
            zerolinecolor: 'rgba(255,255,255,0.15)',
        },
        yaxis: {
            title: { text: 'Normalized Intensity  I/I₀', font: { size: 13 } },
            gridcolor: 'rgba(255,255,255,0.06)',
            range: [0, 1.08],
        },
        showlegend: true,
        legend: {
            x: 0.01, y: 0.99, bgcolor: 'rgba(20,24,36,0.8)',
            bordercolor: 'rgba(255,255,255,0.1)', borderwidth: 1,
            font: { size: 11 },
        },
    };

    Plotly.react(container, [traceA, traceB], layout, { responsive: true, displaylogo: false });
}

/**
 * Render phasor diagram showing vector addition for N slits.
 */
export function renderPhasor(phasorData, params, container) {
    const { x, y, amplitude } = phasorData;
    const nm = params.lambda * 1e9;
    const color = wavelengthToHex(nm);

    // Individual phasor arrows
    const traces = [];

    // Draw each phasor as a trace segment
    for (let i = 0; i < x.length - 1; i++) {
        traces.push({
            x: [x[i], x[i + 1]],
            y: [y[i], y[i + 1]],
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: `hsl(${(i * 360) / params.N}, 80%, 65%)`, width: 2.5 },
            marker: { size: 4, color: `hsl(${(i * 360) / params.N}, 80%, 65%)` },
            showlegend: false,
            hoverinfo: 'skip',
        });
    }

    // Resultant vector
    const lastX = x[x.length - 1];
    const lastY = y[y.length - 1];
    traces.push({
        x: [0, lastX],
        y: [0, lastY],
        type: 'scatter',
        mode: 'lines',
        line: { color, width: 3.5, dash: 'solid' },
        name: `Resultant (A/A₀ = ${amplitude.toFixed(3)})`,
    });

    // Start/end markers
    traces.push({
        x: [0, lastX],
        y: [0, lastY],
        type: 'scatter',
        mode: 'markers',
        marker: { size: 8, color: [color, '#ffd700'], symbol: ['circle', 'diamond'] },
        showlegend: false,
        hoverinfo: 'skip',
    });

    const maxR = Math.max(Math.max(...x.map(Math.abs)), Math.max(...y.map(Math.abs)), 1) * 1.3;

    const layout = {
        ...baseDarkLayout(`Phasor Diagram (θ = ${((params.phasorTheta || 0) * 180 / Math.PI).toFixed(2)}°)`),
        xaxis: {
            title: 'Re',
            gridcolor: 'rgba(255,255,255,0.06)',
            zerolinecolor: 'rgba(255,255,255,0.15)',
            range: [-maxR, maxR],
            scaleanchor: 'y',
        },
        yaxis: {
            title: 'Im',
            gridcolor: 'rgba(255,255,255,0.06)',
            zerolinecolor: 'rgba(255,255,255,0.15)',
            range: [-maxR, maxR],
        },
        showlegend: true,
        legend: {
            x: 0.01, y: 0.99, bgcolor: 'rgba(20,24,36,0.8)',
            bordercolor: 'rgba(255,255,255,0.1)', borderwidth: 1,
            font: { size: 11 },
        },
    };

    Plotly.react(container, traces, layout, { responsive: true, displaylogo: false });
}

/**
 * Export the currently active plot as PNG.
 * @param {string} containerId
 */
export function exportPlot(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    Plotly.downloadImage(el, {
        format: 'png',
        width: 1920,
        height: 1080,
        filename: 'diffraction_pattern',
    });
}

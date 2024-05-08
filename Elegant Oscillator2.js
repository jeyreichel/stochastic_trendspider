describe_indicator('Elegant Oscillatorv2', 'lower');

// Inputs
const rmsLength = input('RMS Length', 50, { min: 1, max: 200 });
const cutoffLength = input('Cutoff Length', 20, { min: 1, max: 100 });
const threshold = input('Threshold', 0.5, { min: 0, max: 1, step: 0.01 });

// Calculate derivative over the 2-period difference
const derivative = series_of(0);
for (let i = 2; i < close.length; i++) {
    derivative[i] = close[i] - close[i - 2];
}

// Calculate RMS using a sliding window over derivative values
const rms = sliding_window_function(derivative, rmsLength, values => {
    const sumOfSquares = values.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumOfSquares / values.length);
});

// Normalized derivative and Inverse Fisher Transform
const normDerivative = series_of(0);
const ift = series_of(0);

for (let i = 0; i < close.length; i++) {
    if (rms[i] !== 0) {
        normDerivative[i] = derivative[i] / rms[i];
        ift[i] = (Math.exp(2 * normDerivative[i]) - 1) / (Math.exp(2 * normDerivative[i]) + 1);
    } else {
        normDerivative[i] = 0;
        ift[i] = 0;
    }
}

// SuperSmoother Filter coefficients
const a1 = Math.exp(-Math.PI * Math.sqrt(2) / cutoffLength);
const coeff2 = 2 * a1 * Math.cos(Math.sqrt(2) * Math.PI / cutoffLength);
const coeff3 = -a1 * a1;
const coeff1 = 1 - coeff2 - coeff3;

// Apply SuperSmoother Filter to ift
const superSmootherFilter = series_of(0);
for (let i = 0; i < ift.length; i++) {
    if (!isNaN(ift[i])) {
        superSmootherFilter[i] = coeff1 * ift[i] + coeff2 * (superSmootherFilter[i - 1] || 0) + coeff3 * (superSmootherFilter[i - 2] || 0);
    } else {
        superSmootherFilter[i] = superSmootherFilter[i - 1] || 0;
    }
}

// Threshold lines
const upperLevel = Array(close.length).fill(threshold);
const zeroLine = Array(close.length).fill(0);
const lowerLevel = Array(close.length).fill(-threshold);

const oscColors = superSmootherFilter.map(value => (value >= 0 ? '#00FF00' : '#FF0000'));

// Plotting the oscillator
paint(superSmootherFilter, {
  name: 'Elegant Oscillator',
  style: 'histogram',
  color: oscColors
});
paint(upperLevel, 'Upper Level', 'green');
paint(zeroLine, 'Zero Line', 'gray');
paint(lowerLevel, 'Lower Level', 'red');
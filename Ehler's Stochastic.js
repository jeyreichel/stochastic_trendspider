describe_indicator('Ehlers Stochastic', 'lower', { decimals: 3, min: 0, max: 1 });

// Inputs
const length = input('Length', 20);
const cutoffLength = input('Cutoff Length', 10);
const roofCutoffLength = input('Roof Cutoff Length', 48);
const overBought = input('Over Bought', 0.8);
const overSold = input('Over Sold', 0.2);
const mode = input('Mode', 'Predictive', ['Predictive', 'Conventional']);
const price = prices['close'];

// Super Smoother Filter
function superSmootherFilter(price, cutoffLength) {
    const a1 = Math.exp(-Math.PI * Math.sqrt(2) / cutoffLength);
    const coeff2 = 2 * a1 * Math.cos(Math.sqrt(2) * Math.PI / cutoffLength);
    const coeff3 = -Math.pow(a1, 2);
    const coeff1 = 1 - coeff2 - coeff3;

    const filt = series_of(null);

    for (let i = 1; i < price.length; i++) {
        filt[i] = coeff1 * (price[i] + price[i - 1]) / 2 +
            coeff2 * (filt[i - 1] ?? 0) +
            coeff3 * (filt[i - 2] ?? 0);
    }
    return filt;
}

// Highpass Filter
function highpassFilter(price, roofCutoffLength) {
    const alpha1 = (Math.cos(Math.sqrt(2) * Math.PI / roofCutoffLength) + Math.sin(Math.sqrt(2) * Math.PI / roofCutoffLength) - 1) / Math.cos(Math.sqrt(2) * Math.PI / roofCutoffLength);

    const highpass = series_of(null);

    for (let i = 2; i < price.length; i++) {
        highpass[i] = Math.pow(1 - alpha1 / 2, 2) * (price[i] - 2 * price[i - 1] + price[i - 2]) +
            2 * (1 - alpha1) * (highpass[i - 1] ?? 0) -
            Math.pow(1 - alpha1, 2) * (highpass[i - 2] ?? 0);
    }

    return highpass;
}

// Roofing Filter
function roofingFilter(price, cutoffLength, roofCutoffLength) {
    const highpass = highpassFilter(price, roofCutoffLength);
    return superSmootherFilter(highpass, cutoffLength);
}

// Ehlers Stochastic calculation
const filteredSeries = roofingFilter(price, cutoffLength, roofCutoffLength);
const highestP = sliding_window_function(filteredSeries, length, window => Math.max(...window));
const lowestP = sliding_window_function(filteredSeries, length, window => Math.min(...window));

const stochSeries = series_of(null);
for (let i = 0; i < filteredSeries.length; i++) {
    stochSeries[i] = (highestP[i] - lowestP[i]) !== 0 ? (filteredSeries[i] - lowestP[i]) / (highestP[i] - lowestP[i]) : 0;
}

const smoothedStochSeries = superSmootherFilter(stochSeries, cutoffLength);

// Paint the results
paint(smoothedStochSeries, 'Smoothed Stochastic', 'red');
paint(series_of(overBought), 'OverBought', '#FF0000');
paint(series_of(overSold), 'OverSold', '#00FF00');
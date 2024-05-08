describe_indicator("TrendFlex_MDI", "lower", { decimals: 3, shortName: "TF" });

const length = input("Length", 40, { min: 1, max: 100 });

// Apply the filter to the price data
const price = market["close"]; // Assuming 'close' prices
const filteredPrice = ema(price, Math.floor(length / 2));

var average = [];
var sumValue = 0;
filteredPrice.forEach((filter, i) => {
    if(i - length >= 0) sumValue -= filteredPrice[i - length];
    sumValue += filter;
    average[i] = filter - sumValue / length;
});

// Calculate RMS (root mean square)
const rms = sliding_window_function(average, 50, window => {
    const sumSquares = window.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sumSquares / window.length);
});

// Calculate TrendFlex
const trendFlex = average.map((avg, i) => avg / rms[i]);

// Define ZeroLine for comparison
const zeroLine = horizontal_line(0);

// Plot TrendFlex
paint(trendFlex, "TrendFlex", "#ff00ff");
paint(zeroLine, "Zero Line", "#cccccc");

// Highlight Up and Down signals on the chart using color markers
const upMarker = Array(trendFlex.length).fill(null);
const downMarker = Array(trendFlex.length).fill(null);

trendFlex.forEach((tf, i) => {
    if (i > 0 && i < trendFlex.length - 1) {
        if (tf < 0 && tf < trendFlex[i - 1] && tf < trendFlex[i + 1]) {
            upMarker[i] = tf;
        }
        if (tf > 0 && tf > trendFlex[i - 1] && tf > trendFlex[i + 1]) {
            downMarker[i] = tf;
        }
    }
});

paint(upMarker, "Up Signal", "green", "stacked_column","2");
paint(downMarker, "Down Signal", "red","stacked_column","2");


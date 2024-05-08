Declare lower;
 
#//parameters
input rangePeriods = 30; #,title="Range Periods")
input priceSmoothing = 0.3; #,title="Price Smoothing")
input indexSmoothing = 0.3; #,title="Index Smoothing")
input emaLength = 20; #, "EMA Period")
input emalength2= 5; # Ema Period 2
 
def na = Double.NaN;
 
def highesthigh = highest(high,rangePeriods);
def lowestlow = lowest(low,rangePeriods);
 
def greatestrange = if (highesthigh-lowestlow)!=0 then (highesthigh-lowestlow) else greatestrange[1];
def midprice = (high+low)/2;
 
#//pricelocation
def pricelocation = 2*((midprice-lowestlow)/greatestrange)-1;
 
#//smoothing of pricelocation
def extmapbuffer = CompoundValue(1,pricesmoothing*extmapbuffer[1] + (1-pricesmoothing)*pricelocation, (1-pricesmoothing)*pricelocation);
def smoothedlocation = if (if extmapbuffer>0.99 then 0.99 else (if extmapbuffer<-0.99 then -0.99 else extmapbuffer))!=1 then
    (if extmapbuffer>0.99 then 0.99 else (if extmapbuffer<-0.99 then -0.99 else extmapbuffer)) else smoothedlocation[1];
 
#//fisherlocation
def fishindex = log((1+smoothedlocation)/(1-smoothedlocation));
#//smoothingoffishindex
def extmapbuffer1 = CompoundValue(1, indexsmoothing * extmapbuffer1[1] + (1-indexsmoothing)*fishindex, (1-indexsmoothing)*fishindex);
def smoothedfish = extmapbuffer1;
def ma = ExpAverage(smoothedfish,emaLength);
def ma2 = ExpAverage(smoothedfish,emaLength2);
 
plot ema = ma; #, color=yellow, linewidth=2)
plot ema2 = ma2; #, color=yellow, linewidth=2)
plot fishHist = smoothedfish; #,color=smoothedfish>0?green:red,linewidth=3,style=histogram)
ema.SetLineWeight(3);
ema.SetDefaultColor(Color.CYAN);
ema2.SetLineWeight(2);
ema2.SetDefaultColor(Color.WHITE);
 
fishHist.SetLineWeight(3);
fishHist.SetPaintingStrategy(PaintingStrategy.HISTOGRAM);
fishHist.AssignValueColor(if smoothedfish>0 then Color.GREEN else COlor.RED);
export function calculate(input) {
  const n = (key, fallback=0) => Number.isFinite(Number(input[key])) ? Number(input[key]) : fallback;
  const qty = Math.max(1, Math.floor(n("quantity", 1)));
  const plates = Math.max(1, Math.floor(n("plates", 1)));
  const grams = Math.max(0, n("grams"));
  const filamentCost = grams / 1000 * Math.max(0, n("filamentPrice"));
  let effectiveHours = Math.max(0, n("hours"));
  if (input.plateMode === "sequential") effectiveHours *= qty;
  else if (input.plateMode === "plates") effectiveHours *= plates;
  // Parallel assumes hours is the total slicer time for the complete plate, not per-part time.
  const electricity = effectiveHours * Math.max(0,n("watts")) / 1000 * Math.max(0,n("electricityRate"));
  const depreciation = effectiveHours * Math.max(0,n("printerPrice")) / Math.max(1,n("lifetimeHours",6000));
  const maintenance = effectiveHours * Math.max(0,n("maintenancePerHour"));
  const labor = Math.max(0,n("labor")), post = Math.max(0,n("postProcessing"));
  const packaging = Math.max(0,n("packaging")), shipping = Math.max(0,n("shipping"));
  const marketing = Math.max(0,n("marketing")), setup = Math.max(0,n("setupFee"));
  const base = filamentCost + electricity + depreciation + maintenance + labor + post + packaging + shipping + marketing + setup;
  const risk = base * Math.max(0,n("riskPct")) / 100;
  const printFloor = Math.max(0,n("minPrintCharge"));
  const minOrder = Math.max(0,n("minOrder"));
  const cost = Math.max(base + risk, printFloor);
  const pct = Math.min(95,Math.max(0,n("targetPct"))) / 100;
  const targetPrice = input.pricingMode === "markup" ? cost * (1+pct) : (pct >= 1 ? cost : cost/(1-pct));
  const discounted = targetPrice * (1-Math.min(90,Math.max(0,n("discountPct")))/100);
  const preTaxPrice = Math.max(minOrder,discounted);
  const tax = preTaxPrice * Math.max(0,n("taxPct"))/100;
  const sellingPrice = preTaxPrice + tax;
  const profit = preTaxPrice - cost;
  const margin = preTaxPrice > 0 ? profit/preTaxPrice*100 : 0;
  const markup = cost > 0 ? profit/cost*100 : 0;
  const minMargin = Math.max(0,n("minMarginPct"));
  const warnings = [];
  if (input.source === "stl") warnings.push("تقدير STL تقريبي؛ لا يشمل دائمًا الجدران والدعامات والحواف والتطهير بدقة. استخدم بيانات السلايسر للسعر النهائي.");
  if (margin < minMargin) warnings.push(`هامش الربح ${margin.toFixed(1)}% أقل من الحد الأدنى المحدد ${minMargin}%. راجع السعر أو الخصم.`);
  if (input.plateMode === "parallel" && qty > 1) warnings.push("تم افتراض أن زمن السلايسر المُدخل هو الزمن الإجمالي للطبق الذي يحتوي كل القطع.");
  return {qty,effectiveHours,filamentCost,electricity,depreciation,maintenance,labor,post,packaging,shipping,marketing,setup,base,risk,cost,targetPrice,preTaxPrice,tax,sellingPrice,profit,margin,markup,warnings,source:input.source||"manual"};
}

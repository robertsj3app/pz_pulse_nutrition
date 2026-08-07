function formatNutritionVal(v) {
  return typeof v === 'number' ? v.toFixed(2) : esc(String(v));
}
function hasTrait(info, name) {
  if (!info || !info.traits || !info.traits.length) return false;
  for (var i = 0; i < info.traits.length; i++) {
    var t = info.traits[i];
    if (!t) continue;
    if (typeof t === 'string' && t === name) return true;
    if (typeof t === 'object' && (t.label === name || t.name === name || t.id === name)) return true;
  }
  return false;
}
function weightState(info) {
  var state = info && info.weightTrait ? String(info.weightTrait).toLowerCase() : '';
  if (state.indexOf('very low weight') !== -1) return 'veryUnderweight';
  if (state.indexOf('very high weight') !== -1) return 'veryOverweight';
  if (state.indexOf('low weight') !== -1) return 'underweight';
  if (state.indexOf('high weight') !== -1) return 'overweight';
  return 'balanced';
}
function calorieZoneColors(info) {
  var state = weightState(info);
  if (state === 'underweight' || state === 'veryUnderweight') {
    return { loss: 'danger', stable: 'warn', gain: 'ok' };
  }
  if (state === 'overweight' || state === 'veryOverweight') {
    return { loss: 'ok', stable: 'warn', gain: 'danger' };
  }
  return { loss: 'warn', stable: 'ok', gain: 'warn' };
}
function multiplierZoneColors(info) {
  var state = weightState(info);
  if (state === 'veryUnderweight') return ['danger', 'warn', 'ok'];
  if (state === 'underweight') return ['danger', 'ok', 'warn'];
  if (state === 'overweight' || state === 'veryOverweight') return ['ok', 'warn', 'danger'];
  return ['ok', 'warn', 'danger'];
}
function calorieZones(info, calories) {
  var weight = (info && info.weight != null) ? Number(info.weight) : 80;
  var slow = hasTrait(info, 'Slow Metabolism');
  var fast = hasTrait(info, 'Fast Metabolism');
  var base = 1000;
  if (slow && weight < 90) base = 700;
  else if (fast && weight > 70) base = 1800;
  var minimumThreshold = base + ((weight - 80) * 40);
  var deficitThreshold = Math.max(0, (weight - 70) * 30);
  var colors = calorieZoneColors(info);
  return [
    { min: -2200, max: deficitThreshold, color: colors.loss, label: 'Weight Loss', title: 'Weight Loss' },
    { min: deficitThreshold, max: minimumThreshold, color: colors.stable, label: 'Stable', title: 'Stable' },
    { min: minimumThreshold, max: 3700, color: colors.gain, label: 'Weight Gain', title: 'Weight Gain' }
  ];
}
function nutritionScaleBounds(value, zones) {
  var min = Number(value) || 0, max = Number(value) || 0;
  for (var i = 0; i < zones.length; i++) {
    min = Math.min(min, zones[i].min);
    max = Math.max(max, zones[i].max);
  }
  if (min === max) { min = min - 1; max = max + 1; }
  return { min: min, max: max };
}
function nutritionBar(label, value, zones) {
  var bounds = nutritionScaleBounds(value, zones), min = bounds.min, max = bounds.max, span = max - min;
  var activeTitle = '';
  for (var i = 0; i < zones.length; i++) {
    var z = zones[i];
    if ((value >= z.min && value < z.max) || (i === zones.length - 1 && value >= z.min)) {
      activeTitle = z.title;
    }
  }
  var out = '<div class="nutrition-track"><div class="row"><span class="lbl">' + esc(label);
  if (activeTitle) out += ' <span class="tag neutral">' + esc(activeTitle) + '</span>';
  out += '</span>'
    + '<span class="val">' + formatNutritionVal(value) + '</span></div>'
    + '<span class="bar range nutrition-bar" title="' + esc(activeTitle || label) + '">';
  for (var i = 0; i < zones.length; i++) {
    var z = zones[i];
    var zoneTitle = esc(z.title || z.label || '');
    var left = Math.max(0, Math.min(100, (Math.max(z.min, min) - min) / span * 100));
    var right = Math.max(0, Math.min(100, (Math.min(z.max, max) - min) / span * 100));
    if (right > left) {
      var fillClass = 'fill zone';
      var fillStyle = '';
      if (z.color && z.color.charAt(0) === '#') {
        fillStyle = 'background:' + z.color + ';';
      } else {
        fillClass += ' ' + z.color;
      }
      out += '<span class="' + fillClass + '" title="' + zoneTitle + '" style="' + fillStyle + 'left:' + left + '%;width:' + (right - left) + '%"></span>';
    }
  }
  var mark = Math.max(0, Math.min(100, (Number(value) - min) / span * 100));
  out += '<span class="nutrition-marker" title="Current ' + formatNutritionVal(value) + '" style="left:' + mark + '%"></span></span>'
    + '<div class="nutrition-scale"><span>' + formatNutritionVal(min) + '</span><span>' + formatNutritionVal(max) + '</span></div>'
    + '</div>';
  return out;
}

function renderNutrition(info, nutrition) {
  if (!nutrition || typeof nutrition !== 'object') return '<div class="empty">No nutrition data.</div>';
  var parts = [];
  if (nutrition.calories != null) {
    parts.push(nutritionBar('Calories', nutrition.calories, calorieZones(info, nutrition.calories)));
  }
  var multiplierColors = multiplierZoneColors(info);
  if (nutrition.carbs != null) {
    parts.push(nutritionBar('Carbs', nutrition.carbs, [
      { min: -500, max: 400, color: multiplierColors[0], label: 'x1 gain', title: 'x1 Weight Gain' },
      { min: 400, max: 700, color: multiplierColors[1], label: 'x2 gain', title: 'x2 Weight Gain' },
      { min: 700, max: 1000, color: multiplierColors[2], label: 'x3 gain', title: 'x3 Weight Gain' }
    ]));
  }
  if (nutrition.protein != null) {
    parts.push(nutritionBar('Protein', nutrition.protein, [
      { min: -500, max: -300, color: 'red', label: 'x0.7 STR', title: 'x0.7 Strength XP' },
      { min: -300, max: 50, color: 'yellow', label: 'No STR bonus', title: 'No Strength XP bonus' },
      { min: 50, max: 300, color: 'green', label: 'x1.5 STR', title: 'x1.5 Strength XP' },
      { min: 300, max: 1000, color: 'yellow', label: 'No extra bonus', title: 'No extra Strength XP bonus' }
    ]));
  }
  if (nutrition.fat != null) {
    parts.push(nutritionBar('Fat', nutrition.fat, [
      { min: -500, max: 400, color: multiplierColors[0], label: 'x1 gain', title: 'x1 Weight Gain' },
      { min: 400, max: 700, color: multiplierColors[1], label: 'x2 gain', title: 'x2 Weight Gain' },
      { min: 700, max: 1000, color: multiplierColors[2], label: 'x3 gain', title: 'x3 Weight Gain' }
    ]));
  }
  if (!parts.length) return '<div class="empty">No nutrition data.</div>';
  return parts.join('');
}

// ---- PZ_Pulse API v1 adapter -- the ONLY change to this file ---------------------------------
// v1 hands the render function the WHOLE payload, the same object every core panel receives, so
// that adding a payload key later never changes any extension's signature. Everything above this
// line is unmodified; the spec in Nutrition_Patch.lua names this wrapper as its `render`.
function renderNutritionPanel(d) {
  return renderNutrition(d && d.info, d && d.nutrition);
}
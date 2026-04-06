const NORMAL_RANGES = {
  hemoglobin: { label: 'Hemoglobin', min: 12, max: 16, unit: 'g/dL' },
  rbc: { label: 'RBC', min: 4, max: 5.5, unit: 'millions/µL' },
  wbc: { label: 'WBC', min: 4000, max: 11000, unit: '/µL' },
  platelets: { label: 'Platelets', min: 150000, max: 450000, unit: '/µL' },
  glucose_fasting: { label: 'Glucose (Fasting)', min: 70, max: 100, unit: 'mg/dL' },
  glucose_random: { label: 'Glucose (Random)', min: 70, max: 140, unit: 'mg/dL' },
  cholesterol_total: { label: 'Total Cholesterol', min: 0, max: 200, unit: 'mg/dL' },
  creatinine: { label: 'Creatinine', min: 0.6, max: 1.3, unit: 'mg/dL' },
  uric_acid: { label: 'Uric Acid', min: 3.5, max: 7.2, unit: 'mg/dL' },
  bilirubin_total: { label: 'Total Bilirubin', min: 0.3, max: 1.2, unit: 'mg/dL' },
  vitamin_d: { label: 'Vitamin D', min: 20, max: 50, unit: 'ng/mL' },
  systolic_bp: { label: 'Systolic BP', min: 90, max: 120, unit: 'mmHg' },
  diastolic_bp: { label: 'Diastolic BP', min: 60, max: 80, unit: 'mmHg' }
};

const PARAM_PATTERNS = [
  {
    key: 'hemoglobin',
    regex: /hemoglobin[\s:]*([\d.]+)\s*(g\/?dL)?/i
  },
  {
    key: 'rbc',
    regex: /rbc[\s:]*([\d.]+)\s*(million\/?µ?l|million\/?u?l|10\^6\/µl)?/i
  },
  {
    key: 'wbc',
    regex: /wbc[\s:]*([\d.]+)\s*(\/µ?l|\/u?l|10\^3\/µl)?/i
  },
  {
    key: 'platelets',
    regex: /platelets?[\s:]*([\d,]+)\s*(\/µ?l|\/u?l)?/i
  },
  {
    key: 'glucose_fasting',
    regex: /(fasting\s+)?blood\s*glucose[\s:]*([\d.]+)\s*(mg\/?dL)?/i,
    valueIndex: 2
  },
  {
    key: 'glucose_random',
    regex: /(random\s+)?blood\s*glucose[\s:]*([\d.]+)\s*(mg\/?dL)?/i,
    valueIndex: 2
  },
  {
    key: 'cholesterol_total',
    regex: /(total\s+)?cholesterol[\s:]*([\d.]+)\s*(mg\/?dL)?/i,
    valueIndex: 2
  },
  {
    key: 'creatinine',
    regex: /creatinine[\s:]*([\d.]+)\s*(mg\/?dL)?/i
  },
  {
    key: 'uric_acid',
    regex: /uric\s+acid[\s:]*([\d.]+)\s*(mg\/?dL)?/i
  },
  {
    key: 'bilirubin_total',
    regex: /(total\s+)?bilirubin[\s:]*([\d.]+)\s*(mg\/?dL)?/i,
    valueIndex: 2
  },
  {
    key: 'vitamin_d',
    regex: /vitamin\s*d[\s:]*([\d.]+)\s*(ng\/?mL)?/i
  },
  {
    key: 'systolic_bp',
    regex: /blood\s*pressure[\s:]*([\d]{2,3})\s*\/\s*([\d]{2,3})\s*mmhg?/i,
    valueIndex: 1
  },
  {
    key: 'diastolic_bp',
    regex: /blood\s*pressure[\s:]*([\d]{2,3})\s*\/\s*([\d]{2,3})\s*mmhg?/i,
    valueIndex: 2
  }
];

const classifyValue = (key, numericValue) => {
  const range = NORMAL_RANGES[key];
  if (!range || Number.isNaN(numericValue)) {
    return 'normal';
  }
  if (numericValue < range.min) return 'low';
  if (numericValue > range.max) return 'high';
  return 'normal';
};

const toRangeText = (min, max, unit) => {
  if (typeof min === 'number' && typeof max === 'number') {
    return `${min}–${max}${unit ? ' ' + unit : ''}`;
  }
  if (typeof max === 'number') {
    return `< ${max}${unit ? ' ' + unit : ''}`;
  }
  return '';
};

const normalizeName = (s) =>
  String(s || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[:\-–]+$/, '');

const shouldSkipParamLabel = (label) => {
  const l = String(label || '').toLowerCase();
  return (
    !label ||
    l.includes('date') ||
    l.includes('time') ||
    l.includes('patient') ||
    l.includes('name') ||
    l.includes('age') ||
    l.includes('gender') ||
    l.includes('phone') ||
    l.includes('address') ||
    l.includes('ref') && l.includes('range') ||
    l.length < 2
  );
};

/**
 * Extracts structured medical parameters with normal/low/high classification
 * from raw OCR / PDF text.
 */
const analyzeMedicalText = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalized = text.replace(/\r/g, '\n');
  const results = [];

  // 1) Known parameters via regex patterns (CBC, glucose, etc.)
  {
    const flat = normalized.replace(/\s+/g, ' ').trim();
    for (const pattern of PARAM_PATTERNS) {
      const match = flat.match(pattern.regex);
      if (!match) continue;

      const valueIndex = pattern.valueIndex || 1;
      const rawValue = (match[valueIndex] || '').toString().replace(/,/g, '');
      const numericValue = parseFloat(rawValue);
      if (Number.isNaN(numericValue)) continue;

      const config = NORMAL_RANGES[pattern.key] || {};
      const unit = (match[valueIndex + 1] || config.unit || '').trim();
      const status = classifyValue(pattern.key, numericValue);

      results.push({
        parameter: config.label || pattern.key,
        value: numericValue,
        unit,
        status,
        range: config.min != null || config.max != null ? { min: config.min, max: config.max, text: toRangeText(config.min, config.max, config.unit || unit) } : undefined
      });
    }
  }

  // 2) Generic table-like extraction: "PARAM   value unit   4.0 - 5.5"
  // Works for many lab PDFs where pdf-parse produces line-based text.
  {
    const lines = normalized
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // label + value + optional unit + optional range "min - max"
    const lineRegex =
      /^([A-Za-z][A-Za-z0-9 ()/%.,+\-]*?)\s+([0-9]+(?:\.[0-9]+)?)\s*([A-Za-zµ/%^0-9.\-]+)?(?:\s+|\s*\(|\s*\[)?([0-9]+(?:\.[0-9]+)?)\s*[-–]\s*([0-9]+(?:\.[0-9]+)?)\s*(?:\)|\])?$/;

    for (const line of lines) {
      const m = line.match(lineRegex);
      if (!m) continue;

      const label = normalizeName(m[1]);
      if (shouldSkipParamLabel(label)) continue;

      const value = parseFloat(m[2]);
      if (Number.isNaN(value)) continue;

      const unit = (m[3] || '').trim();
      const min = parseFloat(m[4]);
      const max = parseFloat(m[5]);
      const hasRange = !Number.isNaN(min) && !Number.isNaN(max);
      const status =
        hasRange
          ? (value < min ? 'low' : value > max ? 'high' : 'normal')
          // When we don't know the normal range from the line or database,
          // mark as 'unknown' instead of incorrectly calling it 'normal'.
          : 'unknown';

      // Avoid duplicate parameter entries (prefer known-pattern extraction)
      const exists = results.some((r) => String(r.parameter).toLowerCase() === label.toLowerCase());
      if (exists) continue;

      results.push({
        parameter: label,
        value,
        unit,
        status,
        range: hasRange ? { min, max, text: toRangeText(min, max, unit) } : undefined
      });
    }
  }

  return results;
};

const buildInsights = (analysis) => {
  const by = {};
  for (const a of Array.isArray(analysis) ? analysis : []) {
    by[String(a.parameter || '').toLowerCase()] = a;
  }

  const get = (...names) => {
    for (const n of names) {
      const v = by[String(n).toLowerCase()];
      if (v) return v;
    }
    return null;
  };

  const conditions = [];
  const add = (name, severity, evidence, advice) => {
    conditions.push({ name, severity, evidence: evidence || [], advice: advice || [] });
  };

  const hb = get('Hemoglobin', 'Hb', 'HGB');
  const rbc = get('RBC');
  const wbc = get('WBC');
  const plt = get('Platelets');
  const gluF = get('Glucose (Fasting)', 'Fasting Blood Glucose', 'Blood Glucose (Fasting)');
  const gluR = get('Glucose (Random)', 'Random Blood Glucose', 'Blood Glucose (Random)');
  const chol = get('Total Cholesterol', 'Cholesterol');
  const cr = get('Creatinine');
  const ua = get('Uric Acid');
  const bili = get('Total Bilirubin', 'Bilirubin');
  const vitd = get('Vitamin D');

  if ((hb && hb.status === 'low') || (rbc && rbc.status === 'low')) {
    const ev = [];
    if (hb && hb.status === 'low') ev.push(`Hemoglobin low (${hb.value}${hb.unit ? ' ' + hb.unit : ''})`);
    if (rbc && rbc.status === 'low') ev.push(`RBC low (${rbc.value}${rbc.unit ? ' ' + rbc.unit : ''})`);
    add(
      'Possible Anemia',
      'moderate',
      ev,
      [
        'Eat iron-rich foods (leafy greens, legumes, meat, jaggery) and vitamin C with meals',
        'If symptoms (fatigue, dizziness) or persistent low values: consult doctor for iron/B12/folate tests',
        'Avoid self-medicating iron without medical guidance'
      ]
    );
  }

  if (wbc && wbc.status === 'high') {
    add(
      'Possible Infection/Inflammation',
      'moderate',
      [`WBC high (${wbc.value}${wbc.unit ? ' ' + wbc.unit : ''})`],
      ['If fever/cough/pain: consult doctor', 'Stay hydrated and rest', 'Do not start antibiotics without prescription']
    );
  }

  if (plt && plt.status === 'low') {
    add(
      'Low Platelets (Thrombocytopenia)',
      'high',
      [`Platelets low (${plt.value}${plt.unit ? ' ' + plt.unit : ''})`],
      [
        'Avoid aspirin/ibuprofen unless prescribed',
        'Seek urgent care if bleeding, bruising, black stools, or very low counts',
        'Follow doctor advice for repeat CBC'
      ]
    );
  }

  const glucose = gluF || gluR;
  if (glucose && glucose.status === 'high') {
    add(
      'High Blood Sugar (Hyperglycemia)',
      'moderate',
      [`${glucose.parameter} high (${glucose.value}${glucose.unit ? ' ' + glucose.unit : ''})`],
      [
        'Reduce sugary drinks/refined carbs; increase protein + fiber',
        'Do regular walking (if doctor allows)',
        'Discuss HbA1c testing and monitoring plan with doctor'
      ]
    );
  }

  if (chol && chol.status === 'high') {
    add(
      'High Cholesterol',
      'moderate',
      [`Cholesterol high (${chol.value}${chol.unit ? ' ' + chol.unit : ''})`],
      [
        'Limit fried/processed foods; choose healthy fats (nuts/olive oil)',
        'Exercise most days',
        'Discuss lipid profile (HDL/LDL/TG) and management with doctor'
      ]
    );
  }

  if (cr && cr.status === 'high') {
    add(
      'Possible Kidney Stress',
      'moderate',
      [`Creatinine high (${cr.value}${cr.unit ? ' ' + cr.unit : ''})`],
      ['Drink adequate water (unless restricted)', 'Avoid excess painkillers', 'Discuss repeat test and eGFR with doctor']
    );
  }

  if (ua && ua.status === 'high') {
    add(
      'High Uric Acid',
      'moderate',
      [`Uric acid high (${ua.value}${ua.unit ? ' ' + ua.unit : ''})`],
      ['Reduce red meat/organ meat, alcohol, sugary drinks', 'Hydrate well', 'Consult doctor if joint pain/swelling']
    );
  }

  if (bili && bili.status === 'high') {
    add(
      'Possible Jaundice/Liver Issue',
      'high',
      [`Bilirubin high (${bili.value}${bili.unit ? ' ' + bili.unit : ''})`],
      ['Consult doctor (may need LFT, hepatitis tests)', 'Avoid alcohol', 'Seek care if yellow eyes/skin, dark urine']
    );
  }

  if (vitd && vitd.status === 'low') {
    add(
      'Vitamin D Deficiency',
      'low',
      [`Vitamin D low (${vitd.value}${vitd.unit ? ' ' + vitd.unit : ''})`],
      ['Sun exposure 10–20 minutes/day', 'Discuss Vitamin D supplementation dose with doctor', 'Add fortified foods/eggs/fish']
    );
  }

  return { conditions };
};

module.exports = {
  NORMAL_RANGES,
  analyzeMedicalText,
  buildInsights
};


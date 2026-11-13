// One device profile for every WebGL layer on the page.
// Tiers: 'high' (desktop GPU), 'mid' (phones/tablets, ordinary laptops), 'low' (weak CPU/GPU or data saver).
let cached = null;

const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i;
const WEAK_GPU = /mali-[4t][0-9]{2}\b|adreno \(tm\) [2-5][0-9]{2}\b|powervr sgx|intel\(r\) hd graphics( [2-5][0-9]{3})?\b|gma /i;

function gpuName() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return null;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return String(name || '');
  } catch { return null; }
}

export function deviceQuality() {
  if (cached) return cached;
  const gpu = gpuName();
  const coarse = matchMedia('(pointer: coarse)').matches;
  const narrow = matchMedia('(max-width: 760px)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const saveData = !!navigator.connection?.saveData;
  let tier = 'high';
  if (coarse || narrow || cores <= 6 || memory <= 4) tier = 'mid';
  if (saveData || cores <= 4 && memory <= 4 || memory <= 2 || cores <= 2 || (gpu && WEAK_GPU.test(gpu))) tier = 'low';
  const profiles = {
    high: {pixelRatio: 1.75, minPixelRatio: 1, antialias: true, shadows: true, physical: true, particles: 260, trails: true, frameMs: 16, idleFrameMs: 33},
    mid: {pixelRatio: 1.35, minPixelRatio: .85, antialias: false, shadows: false, physical: false, particles: 150, trails: true, frameMs: 33, idleFrameMs: 50},
    low: {pixelRatio: 1, minPixelRatio: .7, antialias: false, shadows: false, physical: false, particles: 70, trails: false, frameMs: 33, idleFrameMs: 66},
  };
  cached = {tier, software: !gpu || SOFTWARE_GPU.test(gpu), ...profiles[tier]};
  return cached;
}

// Lowers the drawing-buffer resolution when frames stay slow and restores it when they recover.
export function createGovernor(quality, apply) {
  let ratio = Math.min(devicePixelRatio || 1, quality.pixelRatio);
  const ceiling = ratio, floor = Math.min(ratio, quality.minPixelRatio);
  let sum = 0, count = 0, calm = 0;
  return {
    get ratio() { return ratio; },
    sample(interval, budget) {
      if (interval > 250) return; // tab switch or scroll jank, not a GPU signal
      sum += interval; count++;
      if (count < 24) return;
      const average = sum / count; sum = 0; count = 0;
      if (average > budget * 1.4 && ratio > floor) {
        ratio = Math.max(floor, +(ratio - .2).toFixed(2)); calm = 0; apply(ratio);
      } else if (average < budget * 1.08 && ratio < ceiling && ++calm >= 6) {
        ratio = Math.min(ceiling, +(ratio + .1).toFixed(2)); calm = 0; apply(ratio);
      }
    },
  };
}

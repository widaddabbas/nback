export type RandomFn = () => number;

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function seed() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number): RandomFn {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(seedText: string): RandomFn {
  const effectiveSeed = seedText.trim() || `${Date.now()}-${Math.random()}`;
  const seed = xmur3(effectiveSeed);
  return mulberry32(seed());
}

export function randomChoice<T>(items: T[], random: RandomFn): T {
  if (!items.length) throw new Error('Cannot choose from an empty list.');
  return items[Math.floor(random() * items.length)];
}

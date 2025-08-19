export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return function () {
    state += 0x6D2B79F5;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  private generateUnit: () => number;

  constructor(seed = 123456789) {
    this.generateUnit = mulberry32(seed);
  }

  next(): number {
    return this.generateUnit();
  }

  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1)); 
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

// RNG determinista (mulberry32). Todo lo que afecte la pelea usa esto, nunca Math.random.
const RNG = {
  make(seed) {
    let a = seed >>> 0;
    return {
      next() {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      int(n) { return Math.floor(this.next() * n); },
      get seed() { return a; }
    };
  }
};

import { performance } from 'perf_hooks';

// Mock rewards
const rewards = [];
for (let i = 100; i > 0; i--) {
  rewards.push({ level: i * 5, roleId: `role_${i}`, removeOnNext: true });
}

const newLevel = 82; // Should match level 80 (index 4)

function original() {
  for (let i = 0; i < rewards.length; i++) {
    const r = rewards[i];
    if (newLevel >= r.level) {
      if (r.removeOnNext) {
        const lower = rewards.filter(x => x.level < r.level);
        for (const l of lower) {
          // mock remove
          const x = l.roleId;
        }
      }
      break;
    }
  }
}

function optimized() {
  for (let i = 0; i < rewards.length; i++) {
    const r = rewards[i];
    if (newLevel >= r.level) {
      if (r.removeOnNext) {
        for (let j = i + 1; j < rewards.length; j++) {
          const l = rewards[j];
          // mock remove
          const x = l.roleId;
        }
      }
      break;
    }
  }
}

function benchmark(name, fn) {
  const start = performance.now();
  for (let i = 0; i < 1000000; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(3)} ms`);
}

benchmark('Original', original);
benchmark('Optimized', optimized);

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { globSync } from 'fs';

// Find all test files
const files = globSync('shared/**/__tests__/**/*.test.js');

const stream = run({ files });

stream.on('test:fail', () => {
    process.exitCode = 1;
});

stream.compose(new spec()).pipe(process.stdout);

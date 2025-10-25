import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// Helper function to create package.json files for each build
const createPackageJson = (type) => ({
  name: 'create-package-json',
  generateBundle() {
    const packageJsonContent = JSON.stringify({ type }, null, 2);
    this.emitFile({
      type: 'asset',
      fileName: 'package.json',
      source: packageJsonContent
    });
  }
});

export default {
  input: 'index.ts',
  output: {
    dir: 'dist/esm',
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: '.',
    sourcemap: true
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.esm.json',
      declaration: true,
      declarationMap: true,
      sourceMap: true
    }),
    createPackageJson('module')
  ],
  external: ['tslib']
};
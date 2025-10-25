import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import fs from 'fs';
import path from 'path';

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

// Shared plugins
const basePlugins = [
  nodeResolve({
    preferBuiltins: true
  }),
  commonjs()
];

// TypeScript plugin configurations
const createTsPlugin = (tsconfig, generateDeclarations = false) => typescript({
  tsconfig,
  declaration: generateDeclarations,
  declarationMap: generateDeclarations,
  sourceMap: true
});

export default [
  // ESM Build (JavaScript + Types)
  {
    input: 'index.ts',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: '.',
      sourcemap: true
    },
    plugins: [
      ...basePlugins,
      createTsPlugin('./tsconfig.esm.json', true),
      createPackageJson('module')
    ],
    external: ['tslib']
  },
  
  // CommonJS Build (JavaScript + Types)
  {
    input: 'index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      preserveModules: true,
      preserveModulesRoot: '.',
      sourcemap: true,
      exports: 'auto'
    },
    plugins: [
      ...basePlugins,
      createTsPlugin('./tsconfig.cjs.json', true),
      createPackageJson('commonjs')
    ],
    external: ['tslib']
  }
];
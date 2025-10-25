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
const createTsPlugin = (tsconfig) => typescript({
  tsconfig,
  declaration: false,
  declarationMap: false
});

export default [
  // ESM Build
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
      createTsPlugin('./tsconfig.esm.json'),
      createPackageJson('module')
    ],
    external: ['tslib']
  },
  
  // CommonJS Build
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
      createTsPlugin('./tsconfig.cjs.json'),
      createPackageJson('commonjs')
    ],
    external: ['tslib']
  },
  
  // ESM Type Definitions
  {
    input: 'index.ts',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: '.'
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.esm.json'
      })
    ]
  },
  
  // CommonJS Type Definitions
  {
    input: 'index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      preserveModules: true,
      preserveModulesRoot: '.'
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.cjs.json'
      })
    ]
  }
];
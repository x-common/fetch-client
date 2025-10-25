import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  // Browser ESM Build (bundled)
  {
    input: 'index.ts',
    output: {
      file: 'dist/browser/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.browser.json',
        declaration: false,
        sourceMap: true
      })
    ]
  },
  
  // Browser ESM Build (minified)
  {
    input: 'index.ts',
    output: {
      file: 'dist/browser/index.esm.min.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.browser.json',
        declaration: false,
        sourceMap: true
      }),
      terser({
        format: {
          comments: false
        },
        compress: {
          drop_console: false,
          drop_debugger: true
        }
      })
    ]
  },
  
  // UMD Build for script tags
  {
    input: 'index.ts',
    output: {
      file: 'dist/browser/index.umd.js',
      format: 'umd',
      name: 'FetchClient',
      sourcemap: true,
      globals: {}
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.browser.json',
        declaration: false,
        sourceMap: true
      })
    ]
  },
  
  // UMD Build (minified)
  {
    input: 'index.ts',
    output: {
      file: 'dist/browser/index.umd.min.js',
      format: 'umd',
      name: 'FetchClient',
      sourcemap: true,
      globals: {}
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.browser.json',
        declaration: false,
        sourceMap: true
      }),
      terser({
        format: {
          comments: false
        },
        compress: {
          drop_console: false,
          drop_debugger: true
        }
      })
    ]
  }
];
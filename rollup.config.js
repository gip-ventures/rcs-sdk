import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import pkg from './package.json';

// Extract dependencies to be treated as external
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
];

// Common plugins for all builds
const plugins = [
  nodeResolve(),
  commonjs(),
  json(),
  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: true,
    declaration: true,
    declarationDir: 'dist'
  })
];

export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins
  },
  
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins
  },
  
  // UMD build (minified) for browsers and CDNs
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'LongearsRcsSDK', // Global variable name when loaded in browser
      sourcemap: true,
      globals: {
        axios: 'axios',
        pino: 'pino'
      }
    },
    external,
    plugins: [
      ...plugins,
      terser() // Minify UMD bundle
    ]
  }
];
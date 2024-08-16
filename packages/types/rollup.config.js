import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';

export default [{
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    })
  ]
},
{
  input: 'dist/index.d.ts',
  output: {
    file: 'dist/index.d.ts',
    format: 'es',
  },
  plugins: [dts()]
}];

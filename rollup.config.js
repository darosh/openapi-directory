import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify-es'

export default {
  plugins: [
    resolve(),
    commonjs({
      include: 'node_modules/**',
      sourceMap: false
    }),
    uglify()
  ]
}

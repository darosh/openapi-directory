import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify-es'

export default {
  extend: true,
  plugins: [
    resolve(),
    commonjs(
      {exclude: ['node_modules/**']}
    ),
    uglify()
  ]
}

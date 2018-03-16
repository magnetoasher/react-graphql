const { engines: { node } } = require('./package.json')

module.exports = {
  comments: false,
  presets: [
    [
      '@babel/env',
      {
        targets: { node: node.substring(2) }, // Strip `>=`
        modules: process.env.MODULE ? false : 'commonjs',
        useBuiltIns: 'usage',
        shippedProposals: true,
        exclude: ['es6.promise'],
        loose: true
      }
    ],
    '@babel/preset-react'
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/transform-runtime', { polyfill: false, regenerator: false }]
  ]
}

module.exports = {
  comments: false,
  presets: [
    [
      '@babel/env',
      {
        targets: 'Node >= 8.10',
        modules: process.env.BABEL_ESM ? false : 'cjs',
        shippedProposals: true,
        loose: true
      }
    ]
  ],
  plugins: ['@babel/transform-runtime']
}

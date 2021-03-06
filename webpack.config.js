const path = require('path')

module.exports = {
  entry: path.join(__dirname, 'lib', 'browser.js'),
  output: {
    library: 'DumboEars',
    libraryTarget: 'umd',
    path: path.join(__dirname, 'umd'),
    filename: 'client.js'
  }
}

# Webpack Babel Plugin

## Install

```bash
npm i webpack-babel-plugin -D
```

## Usage

[Document of Webpack Plugins](https://webpack.js.org/configuration/plugins/)

Add the plugin to the list of plugins,like so:

```javascript
import BabelPlugin from 'webpack-babel-plugin'

plugins: [
  new BabelPlugin({
    test: /\.js$/,
    babelOptions: {
      compact: false,
      sourceMap: false
    }
  })
]
```

## BabelOptions

See the babel [options](https://babeljs.io/docs/usage/api/#options).

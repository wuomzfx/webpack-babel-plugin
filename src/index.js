const babel = require('babel-core')
const { SourceMapConsumer } = require('source-map')
const { RawSource, SourceMapSource } = require('webpack-sources')
const RequestShortener = require('webpack/lib/RequestShortener')
const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers')

module.exports = class BabelPlugin {
  constructor (options = {}) {
    this.babelOptions = {
      sourceRoot: process.cwd(),
      sourceMap: true,
      compact: true,
      ...options.babelOptions
    }
    delete options.babelOptions
    this.options = {
      test: /\.js$/i,
      ...options
    }
  }
  apply (compiler) {
    compiler.plugin('compilation', compilation => {
      // 现在设置回调来访问编译中的步骤：
      const requestShortener = new RequestShortener(compiler.context)
      const compiledAssets = new WeakSet()
      compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
        chunks
          .reduce((acc, chunk) => acc.concat(chunk.files || []), [])
          .concat(compilation.additionalChunkAssets || [])
          .filter(ModuleFilenameHelpers.matchObject.bind(null, this.options))
          .forEach(file =>
            this.compile(file, compilation, compiledAssets, requestShortener)
          )
        callback()
      })
    })
  }
  compile (file, compilation, compiledAssets, requestShortener) {
    const asset = compilation.assets[file]
    if (compiledAssets.has(asset)) {
      return
    }
    let sourceMap
    try {
      let input
      let inputSourceMap

      if (this.options.sourceMap && asset.sourceAndMap) {
        const { source, map } = asset.sourceAndMap()
        input = source
        inputSourceMap = map
        if (map) sourceMap = new SourceMapConsumer(inputSourceMap)
      } else {
        input = asset.source()
        inputSourceMap = null
      }

      const { code, map } = babel.transform(input, {
        ...this.babelOptions,
        inputSourceMap,
        filename: file
      })

      const outputSource = this.options.sourceMap
        ? new SourceMapSource(code, file, map, input, inputSourceMap)
        : new RawSource(code)

      compiledAssets.add((compilation.assets[file] = outputSource))
    } catch (error) {
      compilation.errors.push(
        BabelPlugin.buildError(error, file, sourceMap, requestShortener)
      )
    }
  }
  static buildError (err, file, sourceMap, requestShortener) {
    // Handling error which should have line, col, filename and message
    // copy from buildError of uglify
    // https://github.com/webpack-contrib/uglifyjs-webpack-plugin/blob/master/src/index.js

    if (err.line) {
      const original =
        sourceMap &&
        sourceMap.originalPositionFor({
          line: err.line,
          column: err.col
        })
      if (original && original.source) {
        return new Error(
          `${file} from BabelLoder\n${err.message} [${requestShortener.shorten(
            original.source
          )}:${original.line},${original.column}][${file}:${err.line},${
            err.col
          }]`
        )
      }
      return new Error(
        `${file} from BabelLoder\n${err.message} [${file}:${err.line},${
          err.col
        }]`
      )
    } else if (err.stack) {
      return new Error(`${file} from BabelLoder\n${err.stack}`)
    }
    return new Error(`${file} from BabelLoder\n${err.message}`)
  }
}

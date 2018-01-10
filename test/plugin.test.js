const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const webpack = require('webpack')
const BabelPlugin = require('../src/index')

const buildDir = path.join(__dirname, 'build');
const bundleFileName = 'bundle.js'

describe('BabelPlugin Works', () => {
  afterEach(() => {
    rimraf.sync(buildDir);
  });

  test('run webpack ok',  async () => {
    try {
      await runWebpack({
        babelOptions: {
          compact: false
        }
      })
      const isCompiled = getFile(bundleFileName).indexOf('class Person') === -1
      expect(isCompiled).toBe(true)
    } catch (error) {
      expect(error).toMatch('error');
    }
  })
})

function getConfig (opts = {}) {
  return {
    entry: path.join(__dirname, 'resources/classes.js'),
    output: {
      filename: bundleFileName,
      path: buildDir,
    },
    plugins: [ new BabelPlugin(opts) ]
  };
}

function runWebpack (opts) {
  const compiler = webpack(getConfig(opts));
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err);
      resolve(stats);
    });
  });
}

function getFile (file) {
  return fs.readFileSync(path.join(buildDir, file)).toString();
}


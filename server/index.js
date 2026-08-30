const path = require('path')
const fs = require('fs')

const currentWorkDir = process.cwd()

// ==================== 1. FFmpeg 路径拦截 ====================
const localFfmpeg = path.join(currentWorkDir, 'ffmpeg.exe')
process.env.FFMPEG_PATH = localFfmpeg

try {
  const ffmpegInstallerPkg = require.resolve('@ffmpeg-installer/ffmpeg')
  require.cache[ffmpegInstallerPkg] = {
    id: ffmpegInstallerPkg,
    filename: ffmpegInstallerPkg,
    loaded: true,
    exports: { path: localFfmpeg }
  }
} catch (e) {}

// ==================== 2. better-sqlite3 C++ 原生模块拦截 ====================
const localSqliteNode = path.join(currentWorkDir, 'better_sqlite3.node')
if (fs.existsSync(localSqliteNode)) {
  try {
    const bindingsPkg = require.resolve('bindings')
    const originalBindings = require(bindingsPkg)
    require.cache[bindingsPkg].exports = function (opts) {
      const name = typeof opts === 'string' ? opts : (opts && opts.bindings)
      if (name && name.includes('better_sqlite3')) {
        return require(localSqliteNode)
      }
      return originalBindings(opts)
    }
  } catch (e) {}
}

// ==================== 3. 加载后端 API 与前端托管 ====================
const express = require('express')
const apiDefinitions = require('./apis')

const app = express()
const port = process.env.PORT || 3001

const cwdDistPath = path.join(currentWorkDir, 'dist')
const devDistPath = path.join(__dirname, '..', 'dist')
const distPath = fs.existsSync(cwdDistPath) ? cwdDistPath : devDistPath

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

for (const definition of apiDefinitions) {
  app[definition.method](definition.path, definition.handler)
}

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`PopDownloader server listening on http://localhost:${port}`)
})

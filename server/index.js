const express = require('express')
const path = require('path')
const fs = require('fs')
const apiDefinitions = require('./apis')

// ==================== 1. FFmpeg 路径修复 ====================
// 优先使用 PopMusic.exe 同级目录下的 ffmpeg.exe
const localFfmpeg = path.join(process.cwd(), 'ffmpeg.exe')
if (fs.existsSync(localFfmpeg)) {
  process.env.FFMPEG_PATH = localFfmpeg
}

const app = express()
const port = process.env.PORT || 3001

// ==================== 2. 前端静态路径兼容 ====================
// 优先匹配 .exe 同级目录下的 dist，匹配不到则退回开发环境路径
const cwdDistPath = path.join(process.cwd(), 'dist')
const devDistPath = path.join(__dirname, '..', 'dist')
const distPath = fs.existsSync(cwdDistPath) ? cwdDistPath : devDistPath

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// 注册后端 API 接口
for (const definition of apiDefinitions) {
  app[definition.method](definition.path, definition.handler)
}

// 托管前端 dist 网页
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`PopDownloader server listening on http://localhost:${port}`)
})

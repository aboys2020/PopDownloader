const path = require('path')
const fs = require('fs')

// ==================== 1. 黑科技：模块拦截 (必须放在最顶部) ====================
// 获取 .exe 同级目录下的 ffmpeg.exe 路径
const localFfmpeg = path.join(process.cwd(), 'ffmpeg.exe')

// 注入环境变量
process.env.FFMPEG_PATH = localFfmpeg

// 在 require('./apis') 执行前强行覆盖 @ffmpeg-installer/ffmpeg 的缓存
// 彻底阻止它在 pkg 虚拟环境 (C:\snapshot\...) 中检查文件并抛出崩溃异常
try {
  const ffmpegInstallerPkg = require.resolve('@ffmpeg-installer/ffmpeg')
  require.cache[ffmpegInstallerPkg] = {
    id: ffmpegInstallerPkg,
    filename: ffmpegInstallerPkg,
    loaded: true,
    exports: {
      path: localFfmpeg
    }
  }
} catch (e) {
  // 未安装该依赖时自动忽略
}

// ==================== 2. 加载后端与业务接口 ====================
const express = require('express')
const apiDefinitions = require('./apis') // 拦截后加载，绝不会再报错

const app = express()
const port = process.env.PORT || 3001

// 优先匹配当前 .exe 同级目录下的 dist 前端网页
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

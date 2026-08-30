const express = require('express')
const { downloadTrackMedia } = require('../utils/track-download')

const router = express.Router()

router.post('/api/track/download-encrypted', async (req, res) => {
  const { track_id, quality } = req.body || {}

  console.log(`\n[API] 收到单曲下载请求 -> ID: ${track_id}, 音质: ${quality}`)

  if (!track_id) {
    console.log('[API 错误] 缺少必要的 track_id')
    return res.status(400).json({ error: 'Missing track_id' })
  }

  try {
    console.log('[API] 开始调用 downloadTrackMedia 进行解密下载...')
    
    // 开始解密/下载
    const result = await downloadTrackMedia({ trackId: track_id, quality })

    console.log(`[API] 解密成功! 获取到 Buffer, 大小: ${(result.buffer.length / 1024 / 1024).toFixed(2)} MB, 文件名: ${result.fileName}`)

    // 安全处置文件名与响应头
    const encodedFileName = encodeURIComponent(result.fileName)
    res.setHeader('Content-Type', result.contentType || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`)
    res.setHeader('Content-Length', result.buffer.length)

    // 发送音频二进制流
    console.log('[API] 正在向客户端传输数据...')
    
    res.on('finish', () => {
      console.log(`[API 成功] 歌曲 《${result.fileName}》 传输完成！\n`)
    })
    
    res.on('close', () => {
      console.log('[API 提示] 客户端连接已关闭。\n')
    })

    return res.send(result.buffer)
  } catch (error) {
    console.error('[API 异常] 下载解密过程中发生错误:', error.message || error)
    return res.status(500).json({
      error: error.message || 'Failed to download track',
      details: String(error)
    })
  }
})

module.exports = {
  method: 'post',
  path: '/api/track/download-encrypted',
  handler: router
}

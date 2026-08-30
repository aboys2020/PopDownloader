const { fixed } = require('../config/qishui-auth')
const { downloadTrackMedia, getTrackV2Payload } = require('../utils/track-download')

module.exports = {
  name: 'track-download-encrypted',
  method: 'post',
  path: '/api/track/download-encrypted',
  handler: async (req, res) => {
    const { quality = '' } = req.body || {}
    const trackV2Payload = getTrackV2Payload(req.body)

    console.log(`\n[API] 收到单曲下载请求 -> ID: ${trackV2Payload.track_id}, 音质: ${quality}`)

    if (!trackV2Payload.sessionid) {
      console.log('[API 错误] 缺少必要的 sessionid')
      return res.status(400).json({ message: 'sessionid is required' })
    }

    if (!trackV2Payload.track_id) {
      console.log('[API 错误] 缺少必要的 track_id')
      return res.status(400).json({ message: 'track_id is required' })
    }

    if (!quality) {
      console.log('[API 错误] 缺少必要的 quality')
      return res.status(400).json({ message: 'quality is required' })
    }

    try {
      console.log('[API] 开始调用 downloadTrackMedia 进行解密下载...')
      const result = await downloadTrackMedia({
        aid: trackV2Payload.aid || fixed.aid,
        sessionid: trackV2Payload.sessionid,
        track_id: trackV2Payload.track_id,
        quality,
      })

      console.log(`[API] 解密成功! 获取到 Buffer, 大小: ${(result.buffer.length / 1024 / 1024).toFixed(2)} MB, 文件名: ${result.fileName}`)

      const encodedFileName = encodeURIComponent(result.fileName)
      res.setHeader('Content-Type', result.contentType || 'application/octet-stream')
      res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`)
      res.setHeader('Content-Length', result.buffer.length)

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
      return res.status(error.status || 500).json({
        message: 'failed',
        error: error.message,
      })
    }
  }
}

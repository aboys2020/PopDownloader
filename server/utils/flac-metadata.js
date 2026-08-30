/**
 * FLAC 元数据安全处理器
 * 在 pkg/打包环境下，避开容易导致进程挂起的动态 import 和原生二进制依赖
 */
class FlacMetadataWriter {
  static async writeBufferTags(flacBuffer, metadata = {}) {
    console.log('[FlacMetadata] 提示: 为保证 pkg 打包兼容性与防止进程挂起，已安全跳过写入嵌入封面/Tag 步骤。')
    // 直接安全返回解密好的 FLAC 原始 Buffer，不写入磁盘，不调用原生 Tag 依赖
    return flacBuffer
  }
}

module.exports = FlacMetadataWriter

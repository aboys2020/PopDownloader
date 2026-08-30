const fs = require('fs/promises')
const os = require('os')
const path = require('path')
const crypto = require('crypto')

class FlacMetadataWriter {
  async getModule() {
    // Keep this method to avoid breaking callers that may expect an instance method.
    // But in pkg environments we avoid dynamic import; callers should use writeBufferTags.
    return null
  }

  createTempFilePath() {
    const fileName = `pop-downloader-${crypto.randomUUID()}.flac`
    return path.join(os.tmpdir(), fileName)
  }

  toTagValue(value) {
    if (Array.isArray(value)) {
      const list = value
        .map((item) => String(item || '').trim())
        .filter(Boolean)

      return list.length > 0 ? list : null
    }

    const normalized = String(value || '').trim()
    return normalized ? normalized : null
  }

  buildTagMap(metadata = {}) {
    const tagMap = {}

    const entries = {
      TITLE: metadata.title,
      ARTIST: metadata.artist,
      ALBUM: metadata.album,
      ALBUMARTIST: metadata.albumArtist,
      DATE: metadata.date,
      YEAR: metadata.year,
      GENRE: metadata.genre,
      COMPOSER: metadata.composer,
      LYRICIST: metadata.lyricist,
      COMMENT: metadata.comment,
      TRACKNUMBER: metadata.trackNumber,
      DISCNUMBER: metadata.discNumber,
    }

    for (const [key, value] of Object.entries(entries)) {
      const normalizedValue = this.toTagValue(value)

      if (normalizedValue) {
        tagMap[key] = normalizedValue
      }
    }

    return tagMap
  }

  /**
   * Safe writeBufferTags implementation for pkg environments.
   * This method avoids dynamic import('flac-tagger') and writing to disk in
   * ways that may hang when packaged. It returns the original buffer unchanged
   * and logs a warning so FLAC metadata is skipped in packaged builds.
   */
  async writeBufferTags({ flacBuffer, metadata = {}, coverBuffer = null, coverMime = null }) {
    if (!Buffer.isBuffer(flacBuffer) || flacBuffer.length === 0) {
      throw new Error('flacBuffer must be a non-empty Buffer.')
    }

    console.log('[FlacMetadata] Skipping flac-tagger metadata write to maintain pkg compatibility.')
    // Return original buffer unchanged
    return flacBuffer
  }
}

module.exports = { FlacMetadataWriter }

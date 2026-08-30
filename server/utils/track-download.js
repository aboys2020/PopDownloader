async function fetchTrackPayload({ aid = fixed.aid, sessionid, track_id }) {
  const trackV2Url = buildUrl(endpoints.trackV2, getPcQuery({ aid }))

  // Debug log: show URL and identifiers (avoid logging sensitive full cookies in prod)
  console.log(`[track-download] fetchTrackPayload -> url: ${trackV2Url}, sessionid_present: ${Boolean(sessionid)}, track_id: ${track_id}`)

  const trackV2Response = await fetch(trackV2Url, {
    method: 'POST',
    headers: {
      Cookie: `sessionid=${sessionid};`,
      'Content-Type': 'application/json; charset=utf-8',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({
      track_id,
      media_type: 'track',
      queue_type: 'search_one_track',
      scene_name: 'search',
    }),
  })

  // Log status and content-type for debugging
  const contentType = trackV2Response.headers.get('content-type') || ''
  console.log(`[track-download] trackV2 response status=${trackV2Response.status} content-type=${contentType}`)

  // Try to parse JSON but handle non-JSON gracefully
  let trackPayload = null
  try {
    if (contentType.includes('application/json')) {
      trackPayload = await trackV2Response.json()
    } else {
      const text = await trackV2Response.text().catch(() => '')
      const error = new Error(`Upstream did not return JSON (status ${trackV2Response.status})`)
      error.status = trackV2Response.status
      error.payload = text
      throw error
    }
  } catch (err) {
    if (!err.payload) {
      const text = await trackV2Response.text().catch(() => '')
      err.payload = text
    }
    const error = new Error(err.message || 'Failed to parse track payload')
    error.status = trackV2Response.status
    error.payload = err.payload
    throw error
  }

  if (!trackV2Response.ok) {
    const error = new Error(trackPayload?.error || trackPayload?.message || '获取音频信息失败')
    error.status = trackV2Response.status
    error.payload = trackPayload
    throw error
  }

  return trackPayload
}

import { describe, expect, it } from 'vitest'

import { blobToBase64, nativeShareCardErrorMessage } from './nativeShareCard'

describe('native share card bridge', () => {
  it('converts a PNG blob to unprefixed base64', async () => {
    await expect(blobToBase64(new Blob(['png'], { type: 'image/png' }))).resolves.toBe('cG5n')
  })

  it('rejects empty and non-PNG blobs before calling native code', async () => {
    await expect(blobToBase64(new Blob([], { type: 'image/png' }))).rejects.toThrow('分享卡图片为空')
    await expect(blobToBase64(new Blob(['jpg'], { type: 'image/jpeg' }))).rejects.toThrow('分享卡必须是 PNG 图片')
  })

  it('maps stable native error codes to explicit Chinese messages', () => {
    expect(nativeShareCardErrorMessage({ code: 'PERMISSION_DENIED' })).toBe('未获得图片保存权限')
    expect(nativeShareCardErrorMessage({ code: 'NO_SHARE_TARGET' })).toBe('没有找到可用的分享应用')
    expect(nativeShareCardErrorMessage({ code: 'IMAGE_TOO_LARGE' })).toBe('分享卡超过 10 MB，无法处理')
    expect(nativeShareCardErrorMessage(new Error('unknown'))).toBe('操作失败，请稍后重试')
  })
})

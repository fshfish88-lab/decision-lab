import { registerPlugin } from '@capacitor/core'

export type NativeShareCardErrorCode =
  | 'INVALID_BASE64'
  | 'IMAGE_TOO_LARGE'
  | 'PERMISSION_DENIED'
  | 'SAVE_FAILED'
  | 'NO_SHARE_TARGET'
  | 'SHARE_FAILED'

export interface ShareCardPluginApi {
  saveImage(options: { base64: string }): Promise<{ uri: string; fileName: string }>
  shareImage(options: { base64: string }): Promise<{ chooserOpened: true }>
}

export interface NativeShareCardError {
  code: NativeShareCardErrorCode
  message: string
}

export const nativeShareCard = registerPlugin<ShareCardPluginApi>('ShareCard')

export function blobToBase64(blob: Blob): Promise<string> {
  if (blob.type !== 'image/png') return Promise.reject(new Error('分享卡必须是 PNG 图片'))
  if (blob.size === 0) return Promise.reject(new Error('分享卡图片为空'))

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('分享卡读取失败'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('分享卡读取失败'))
        return
      }
      const marker = 'base64,'
      const markerIndex = reader.result.indexOf(marker)
      if (markerIndex < 0) {
        reject(new Error('分享卡编码失败'))
        return
      }
      resolve(reader.result.slice(markerIndex + marker.length))
    }
    reader.readAsDataURL(blob)
  })
}

function errorCode(error: unknown): NativeShareCardErrorCode | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined
  const code = error.code
  return code === 'INVALID_BASE64' ||
    code === 'IMAGE_TOO_LARGE' ||
    code === 'PERMISSION_DENIED' ||
    code === 'SAVE_FAILED' ||
    code === 'NO_SHARE_TARGET' ||
    code === 'SHARE_FAILED'
    ? code
    : undefined
}

export function nativeShareCardErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case 'INVALID_BASE64':
      return '分享卡数据无效，请重新生成'
    case 'IMAGE_TOO_LARGE':
      return '分享卡超过 10 MB，无法处理'
    case 'PERMISSION_DENIED':
      return '未获得图片保存权限'
    case 'SAVE_FAILED':
      return '保存失败，图片未写入相册'
    case 'NO_SHARE_TARGET':
      return '没有找到可用的分享应用'
    case 'SHARE_FAILED':
      return '系统分享面板打开失败'
    default:
      return '操作失败，请稍后重试'
  }
}

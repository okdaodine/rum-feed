export interface IUploadVideoRes {
  fileName: string
  url: string
  poster: string
  mimetype: string
  chunks: string[]
  width: number
  height: number
  duration: string
}
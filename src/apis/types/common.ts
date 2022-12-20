export interface INote {
  type: 'Note'
  content: string
  id?: string
  name?: string
  image?: IImage[]
  inreplyto?: {
    trxid: string
  }
}

export interface IImage {
  mediaType: string
  content: string
  name?: string
}

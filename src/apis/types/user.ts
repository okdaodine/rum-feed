export interface IUser {
  postCount: number
  followingCount: number
  followerCount: number
  following?: boolean
  muted?: boolean
  role: 'admin' | ''
}
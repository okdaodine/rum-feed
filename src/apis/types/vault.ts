export interface IVaultUser {
  id: number
  created_at: string
  updated_at: string
  username: string
  display_name: string
  email: null
  phone: null
  password: null
  avatar_url: string
  mixin: {
    id: number
    created_at: string
    updated_at: string
    userid: number
    mixin_userid: string
    identity_number: string
    full_name: string
    biography: string
    phone: string
    avatar_url: string
  }
}

export interface IVaultAppUser {
  app_id: number
  userid: number
  eth_address: string
  eth_pub_key: string
  access_token: string
  provider: 'mixin' | 'github' | 'web3'
}
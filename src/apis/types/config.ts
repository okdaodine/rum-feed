export interface IConfig {
  siteName: string
  logo: string
  version: string
  defaultGroupId: string
  repo: string
  hasAdmin: boolean
  groupsPageIsOnlyVisibleToAdmin: boolean
  walletProviders: string[]
  supportAccountPubKey: string
  enabledV1Migration: boolean
  enabledVideo: boolean
}
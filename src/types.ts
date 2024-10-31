export const MAILING_FILE_PATH = 'resources/mail-content.txt'
export const MILING_DEST_PATH = 'resources/dest-email.txt'

export const ONE_DAY_MS = 1000 * 60 * 60 * 24
export const ONE_HOUR_MS = 1000 * 60 * 60

export type AccountId = string

export interface Config {
  rpcEndpoint: string
  chainName: string
  keyType: KeypairType
  privateSeed: string
  validatorStashes: AccountId[]
  forceClaim: boolean
  mailing?: EmailParams
}

export type EmailParams = {
  to: string
}

export type KeypairType = 'ed25519' | 'sr25519' | 'ecdsa' | 'ethereum'

export type ActiveEra = {
  index: number
  start: number
}

import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'

import * as fs from 'fs'
import { Config, AccountId } from './types'

export function readConfig(): Config {
  const rawData = fs.readFileSync('config.json')
  const config: Config = JSON.parse(rawData.toString())

  return config
}

export function logMessage(message: string) {
  const timestamp = new Date().toISOString()
  console.log(`\x1b[1m\x1b[34m[INFO]\x1b[0m [${timestamp}] ${message}`)
}

export class ApiManager {
  public api: ApiPromise
  public config: Config
  private keyring: Keyring

  public constructor(api: ApiPromise, config: Config, keyring: Keyring) {
    this.api = api
    this.config = config
    this.keyring = keyring
  }

  public keyPair() {
    return this.keyring.addFromUri(this.config.privateSeed)
  }
}

export class ApiBuilder {
  static async build(): Promise<ApiManager> {
    const config = readConfig()
    const api = await ApiPromise.create({ provider: new WsProvider(config.rpcEndpoint) })
    const keyring = new Keyring({ type: config.keyType })

    return new ApiManager(api, config, keyring)
  }
}

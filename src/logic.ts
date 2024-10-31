import { ApiPromise, Keyring } from '@polkadot/api'
import {
  AccountId,
  ActiveEra,
  MAILING_FILE_PATH,
  MILING_DEST_PATH,
  ONE_DAY_MS,
  ONE_HOUR_MS,
} from './types'
import { ApiManager, logMessage } from './config'
import * as fs from 'fs'

export class PayoutExecutor {
  private manager: ApiManager

  public constructor(manager: ApiManager) {
    this.manager = manager
  }

  async activeEra(): Promise<ActiveEra> {
    const era = (await this.manager.api.query.staking.activeEra()).toString()
    const activeEra: ActiveEra = JSON.parse(era)
    return activeEra
  }

  async hasClaimedRewards(eraIdx: number, stash: AccountId): Promise<boolean> {
    const claimed = (await this.manager.api.query.staking.claimedRewards(eraIdx, stash)).toString()
    const claims: any[] = JSON.parse(claimed)
    return claims.length > 0
  }

  public async execute() {
    console.log('\n')
    logMessage(`Starting payout..`)

    const stashes = this.manager.config.validatorStashes
    const keyPair = this.manager.keyPair()

    const forceClaim = this.manager.config.forceClaim
    let eraIdx = 0
    let waitTime = ONE_DAY_MS
    while (true) {
      const era = await this.activeEra()
      if (era.index > eraIdx) {
        logMessage(`New era: ${era.index}`)

        let stashesForClaim: AccountId[] = []
        // Add stashes that have not claimed rewards
        for (const stash of stashes) {
          if (forceClaim) {
            stashesForClaim.push(stash)
            continue
          }

          const claimed = await this.hasClaimedRewards(era.index, stash)
          if (!claimed) {
            logMessage(`Rewards under stash ${stash} must still be claimed for era ${era.index}`)

            stashesForClaim.push(stash)
          } else {
            logMessage(
              `Rewards under stash ${stash} have already been claimed for era ${era.index}`,
            )
          }
        }

        let batchPayouts = []
        // Create batch with all `payoutStakers` transactions
        for (const validatorStash of stashesForClaim) {
          const payoutTx = this.manager.api.tx.staking.payoutStakers(validatorStash, era.index)
          batchPayouts.push(payoutTx)
        }
        if (batchPayouts.length > 0) {
          logMessage(`Payout batch length: ${batchPayouts.length}`)

          const batchPayoutTxHash = await this.manager.api.tx.utility
            .batchAll(batchPayouts)
            .signAndSend(keyPair)

          const txMessage = `Payout stakers transaction submitted with hash: ${batchPayoutTxHash}`
          logMessage(txMessage)

          if (this.manager.config.mailing) {
            fs.writeFileSync(
              MAILING_FILE_PATH,
              `${this.manager.config.chainName} payoutStakers submitted.\n${txMessage}`,
            )
            fs.writeFileSync(MILING_DEST_PATH, this.manager.config.mailing.to)
          }
        } else {
          logMessage(`No payouts to be made for era ${era.index}`)
        }

        eraIdx = era.index
        waitTime = ONE_DAY_MS
      } else {
        waitTime = ONE_HOUR_MS
      }

      logMessage(`Waiting ${waitTime / (1000 * 60 * 60)} hours before next era check..`)
      await sleep(waitTime)
    }
  }
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

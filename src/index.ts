import { ApiBuilder, ApiManager, logMessage } from './config'
import { PayoutExecutor } from './logic'

async function main() {
  const api = await ApiBuilder.build()

  const payout = new PayoutExecutor(api)
  await payout.execute()

  process.exit(-1)
}

main().catch((error) => {
  console.error(error)
  process.exit(-1)
})

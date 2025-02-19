import IMessageQueue from "@/interfaces/IMessageQueue";
import IMeta from "@/interfaces/IMeta";
import IRPC from "@/interfaces/IRPC";
import { isAddressEqual, toBytes } from "viem";
import logger from "@/utils/logger";

class MonitoringBot {
  private mq: IMessageQueue;
  private meta: IMeta;
  private rpc: IRPC;
  private log = logger.child({}, { msgPrefix: "[monitoring] " });

  constructor(mq: IMessageQueue, meta: IMeta, rpc: IRPC) {
    this.mq = mq;
    this.meta = meta;
    this.rpc = rpc;
  }

  async main() {
    while (true) {
      const latest = await this.rpc.getLatestHead();
      const processed = this.meta.monitoringProcessedHead;
      const step = this.meta.monitoringStep;
      if (latest <= processed + step) {
        this.log.info(
          "no new block, waiting; latest=%d, processed=%d, step=%d",
          latest,
          processed,
          step
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.meta.monitorInterval)
        );
        continue;
      }
      const fromBlock = processed + 1;
      const toBlock = processed + step;
      this.log.debug(
        "fetching logs; fromBlock=%d, toBlock=%d",
        fromBlock,
        toBlock
      );
      const logs = await this.rpc.getFilterLogs({
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
        address: this.meta.pingContractAddress,
        topics: [this.meta.pingTopicHash],
      });
      this.log.info("fetched logs; count=%d", logs.length);
      for (const log of logs) {
        if (!isAddressEqual(log.address, this.meta.pingContractAddress)) {
          this.log.debug("skipping log; address mismatch; log=%o", log);
          continue;
        }
        if (
          Buffer.compare(
            toBytes(log.topics[0]),
            toBytes(this.meta.pingTopicHash)
          ) !== 0
        ) {
          this.log.debug("skipping log; topic mismatch; log=%o", log);
          continue;
        }
        const msg = {
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          srcTxHash: log.txHash,
          retryCount: 0,
        };
        this.log.info("sending message; msg=%o", msg);
        await this.mq.send(msg);
      }
      // update processed head
      this.meta.monitoringProcessedHead = toBlock;
      await this.meta.save();
    }
  }
}

export default MonitoringBot;

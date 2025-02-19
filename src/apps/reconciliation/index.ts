import ITransaction from "@/interfaces/ITransaction";
import IMessageQueue from "@/interfaces/IMessageQueue";
import ITxRepository from "@/interfaces/ITxRepository";
import IMeta from "@/interfaces/IMeta";
import IRPC from "@/interfaces/IRPC";
import { TransactionStatus } from "@/interfaces/ITransaction";
import logger from "@/utils/logger";
import IPrivateKeyManager from "@/interfaces/IPrivateKeyManager";

class ReconciliationBot {
  private mq: IMessageQueue;
  private meta: IMeta;
  private rpc: IRPC;
  private txRepo: ITxRepository;
  private km: IPrivateKeyManager;
  private log = logger.child({}, { msgPrefix: "[reconciliation] " });

  constructor(
    mq: IMessageQueue,
    meta: IMeta,
    rpc: IRPC,
    txRepo: ITxRepository,
    km: IPrivateKeyManager
  ) {
    this.mq = mq;
    this.meta = meta;
    this.rpc = rpc;
    this.txRepo = txRepo;
    this.km = km;
  }

  private async reconcileTransaction(tx: ITransaction): Promise<boolean> {
    this.log.info("reconciling transaction; tx=%o", tx);
    const { confirmed } = await this.rpc.getTransactionReceipt(tx.txHash);
    if (confirmed) {
      tx.status = TransactionStatus.Success;
      await this.txRepo.update(tx);
      await this.km.updateConfirmedNonce(tx.privateKeyAddr, tx.nonce);
      return false;
    }
    // expire if it was sent too long ago
    const now = Date.now();
    const sentAt = tx.sentAt.getTime();
    if (now - sentAt > this.meta.reconciliationTxTimeout) {
      // reset the nonce
      await this.km.lock(); // XXX: this is a hack to avoid concurrent race condition
      this.km.updateLatestNonceNoLock(tx.privateKeyAddr, tx.nonce - 1n);
      // retry the tx and all the following tx with the same private key
      const txsToRetry = await this.txRepo.getByPrivateKeyAddr(
        tx.privateKeyAddr
      );
      for (const txToRetry of txsToRetry) {
        txToRetry.status = TransactionStatus.Expired;
        txToRetry.retryCount += 1;
        const msg = {
          blockNumber: txToRetry.blockNumber,
          blockHash: txToRetry.blockHash,
          srcTxHash: txToRetry.srcTxHash,
          sentTxId: txToRetry.id,
          retryCount: txToRetry.retryCount,
        };
        this.log.info("sending message for retry; msg=%o", msg);
        await this.txRepo.update(txToRetry);
        await this.mq.send(msg);
      }
      this.km.unlock();
      return true;
    }
    return false;
  }

  async main() {
    while (true) {
      const txs = await this.txRepo.getEarliestSentTransactions(
        this.meta.reconciliationBatchSize
      );
      for (const tx of txs) {
        const retried = await this.reconcileTransaction(tx);
        // if retried, the txs are stale and we should break the loop
        if (retried) {
          break;
        }
      }
      await new Promise((resolve) =>
        setTimeout(resolve, this.meta.reconciliationInterval)
      );
    }
  }
}

export default ReconciliationBot;

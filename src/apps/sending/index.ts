import IMessage from "@/interfaces/IMessage";
import ITransaction from "@/interfaces/ITransaction";
import IMessageQueue from "@/interfaces/IMessageQueue";
import ITxRepository from "@/interfaces/ITxRepository";
import IPrivateKeyManager from "@/interfaces/IPrivateKeyManager";
import IMeta from "@/interfaces/IMeta";
import IRPC from "@/interfaces/IRPC";
import { TransactionStatus } from "@/interfaces/ITransaction";
import { v4 as uuidv4 } from "uuid";
import {
  calcMockTxHash,
  calcAddrFromPrivateKey,
  buildMockTxData,
} from "@/mocks/utils";
import logger from "@/utils/logger";

class SendingBot {
  private mq: IMessageQueue;
  private meta: IMeta;
  private rpc: IRPC;
  private txRepo: ITxRepository;
  private km: IPrivateKeyManager;
  private log = logger.child({}, { msgPrefix: "[sending] " });

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

  async handler(msg: IMessage) {
    this.log.info("handling message; msg=%o", msg);
    if (msg.retryCount > this.meta.maxRetryCount) {
      if (!msg.sentTxId) {
        throw new Error("sentTxId is required");
      }
      // mark as dead
      const tx = await this.txRepo.get(msg.sentTxId);
      tx.status = TransactionStatus.Dead;
      await this.txRepo.update(tx);
      return;
    }
    // build the tx object
    let tx: ITransaction;
    let isRetry = false;
    if (msg.sentTxId) {
      // is retrying tx
      isRetry = true;
      tx = await this.txRepo.get(msg.sentTxId);
      tx.sentAt = new Date();
      tx.status = TransactionStatus.Sent;
      tx.retryCount = msg.retryCount + 1;
    } else {
      tx = {
        id: uuidv4(),
        sentAt: new Date(),
        status: TransactionStatus.Sent,
        blockNumber: msg.blockNumber,
        blockHash: msg.blockHash,
        srcTxHash: msg.srcTxHash,
        txHash: "0x0", // to be updated
        privateKeyAddr: "0x0", // to be updated
        nonce: -1n, // to be updated
        retryCount: 0,
      };
    }

    // get private key and nonce
    const { privateKey, nonce } = await this.km.getNextPrivateKeyAndNonce();
    this.log.debug(
      "private key and nonce; privateKey=%s, nonce=%d",
      privateKey,
      nonce
    );
    const calldata = buildMockTxData();

    // update tx fields
    tx.privateKeyAddr = calcAddrFromPrivateKey(privateKey);
    tx.nonce = nonce;
    // XXX: Here we calculate mock tx hash with the tx data, private key, and nonce.
    // In the real world, signing the tx, nonce and gas price with the private key
    // would be the correct way to calculate the tx hash.
    tx.txHash = calcMockTxHash({
      to: this.meta.pingContractAddress,
      data: calldata,
      privateKey,
      nonce,
    });

    if (isRetry) {
      await this.txRepo.update(tx);
    } else {
      await this.txRepo.create(tx);
    }
    await this.rpc.sendTransaction({
      to: this.meta.pingContractAddress,
      data: calldata,
      privateKey,
      nonce,
    });
  }

  async main() {
    this.mq.subscribe(this.handler.bind(this));
  }
}

export default SendingBot;

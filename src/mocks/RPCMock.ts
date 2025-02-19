import IRPC, { ILog } from "@/interfaces/IRPC";
import { Address, Hex } from "viem";
import { calcMockTxHash } from "@/mocks/utils";
import logger from "@/utils/logger";
import IMeta from "@/interfaces/IMeta";
import { calcAddrFromPrivateKey } from "@/mocks/utils";

class RPCMock implements IRPC {
  private meta: IMeta;
  private latestHead: number = 0;
  private txMap: Record<
    Hex,
    {
      privateKeyAddress: Address;
      nonce: bigint;
    }
  > = {};
  private latestConfirmedNonceMap: Record<Address, bigint> = {};
  private log = logger.child({}, { msgPrefix: "[rpc_mock] " });

  constructor(meta: IMeta) {
    this.meta = meta;
  }

  async getLatestHead(): Promise<number> {
    return ++this.latestHead;
  }

  async getFilterLogs(filter: {
    fromBlock: bigint;
    toBlock: bigint;
    address: string;
    topics: string[];
  }): Promise<ILog[]> {
    this.log.debug("get_filter_logs; filter=%o", filter);
    return [
      {
        blockNumber: filter.fromBlock,
        blockHash: this.meta.pingTopicHash,
        txHash: this.meta.pingTopicHash,
        address: this.meta.pingContractAddress,
        topics: [this.meta.pingTopicHash],
        data: "0x12345",
      },
      {
        blockNumber: filter.toBlock,
        blockHash: this.meta.pingTopicHash,
        txHash: this.meta.pingTopicHash,
        address: this.meta.pingContractAddress,
        topics: [this.meta.pingTopicHash],
        data: "0x12345",
      },
    ];
  }

  async sendTransaction({
    to,
    data,
    privateKey,
    nonce,
  }: {
    to: Address;
    data: Hex;
    privateKey: Hex;
    nonce: bigint;
  }): Promise<Hex> {
    this.log.debug("send_tx; tx=%o", { to, data, privateKey, nonce });
    const txHash = calcMockTxHash({
      to,
      data,
      privateKey,
      nonce,
    });
    this.txMap[txHash] = {
      privateKeyAddress: calcAddrFromPrivateKey(privateKey),
      nonce,
    };
    return txHash;
  }

  async getTransactionReceipt(txHash: Hex): Promise<{ confirmed: boolean }> {
    const tx = this.txMap[txHash];
    if (!tx) {
      throw new Error(`tx not found; txHash=${txHash}`);
    }
    const latestConfirmedNonce =
      this.latestConfirmedNonceMap[tx.privateKeyAddress] || BigInt(0);
    let confirmed = false;
    if (tx.nonce <= latestConfirmedNonce) {
      confirmed = true; // avoid unexpected behavior
    } else {
      confirmed = Math.random() > 0.2;
    }
    if (confirmed) {
      this.latestConfirmedNonceMap[tx.privateKeyAddress] = tx.nonce;
    }
    this.log.debug(
      "get_tx_receipt; txHash=%s; confirmed=%s",
      txHash,
      confirmed
    );
    return { confirmed };
  }
}

export default RPCMock;

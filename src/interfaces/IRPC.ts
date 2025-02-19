import { Address, Hex } from "viem";

export interface ILog {
  blockNumber: bigint;
  blockHash: Hex;
  txHash: Hex;
  address: Address;
  topics: Hex[];
  data: Hex;
}

interface IRPC {
  getLatestHead(): Promise<number>;

  getFilterLogs(filter: {
    fromBlock: bigint;
    toBlock: bigint;
    address: Address;
    topics: Hex[];
  }): Promise<ILog[]>;

  sendTransaction(params: {
    to: Address;
    data: Hex;
    privateKey: Hex;
    nonce: bigint;
  }): Promise<Hex>;

  getTransactionReceipt(txHash: Hex): Promise<{
    confirmed: boolean;
  }>;
}

export default IRPC;

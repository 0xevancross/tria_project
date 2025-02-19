import { Hex } from "viem";

interface IMessage {
  blockNumber: bigint;
  blockHash: Hex;
  srcTxHash: Hex;
  sentTxId?: string;
  retryCount: number;
}

export default IMessage;

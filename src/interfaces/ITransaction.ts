import { Hex, Address } from "viem";

//
// 0->Sent: sending_bot.handler
// Sent -> Success: reconciliation_bot.reconcileTransaction
// Sent -> Expired: reconciliation_bot.reconcileTransaction
//
// Expired -> Sent: sending_bot.handler
// Expired -> Dead: sending_bot.handler
export enum TransactionStatus {
  Sent = 'sent',
  Success = 'success',
  Expired = 'expired',
  Dead = 'dead',
}

// ITransaction is the transaction that was sent by the
// sending bot.
interface ITransaction {
  id: string;
  sentAt: Date;
  status: TransactionStatus;
  blockNumber: bigint;
  blockHash: Hex;
  srcTxHash: Hex;
  txHash: Hex;
  privateKeyAddr: Address;
  nonce: bigint;
  retryCount: number;
}

export default ITransaction;

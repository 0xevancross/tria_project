import { Address, Hex } from "viem";

interface IMeta {
  // shared meta
  pingContractAddress: Address;
  pingTopicHash: Hex;

  // monitoring bot meta
  monitorInterval: number; // in ms
  monitoringStep: number; // in blocks
  monitoringProcessedHead: number; // block number

  // sending bot meta
  maxRetryCount: number;

  // reconciliation bot meta
  reconciliationInterval: number; // in ms
  reconciliationBatchSize: number; // number of transactions to process in one batch
  reconciliationTxTimeout: number; // in ms

  // actions
  save(): Promise<void>;
}

export default IMeta;

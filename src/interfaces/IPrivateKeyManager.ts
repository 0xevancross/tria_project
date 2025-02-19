import { Hex, Address } from "viem";

interface IPrivateKeyManager {
  getNextPrivateKeyAndNonce(): Promise<{ privateKey: Hex; nonce: bigint }>;
  updateConfirmedNonce(privateKey: Hex, nonce: bigint): Promise<void>;
  updateLatestNonce(privateKey: Hex, nonce: bigint): Promise<void>;

  // XXX: low level functions to avoid concurrent race condition
  lock(): Promise<void>;
  unlock(): void;
  updateLatestNonceNoLock(privateKeyAddr: Address, nonce: bigint): void;
}

export default IPrivateKeyManager;

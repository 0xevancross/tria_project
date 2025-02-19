import IPrivateKeyManager from "@/interfaces/IPrivateKeyManager";
import { Hex, Address } from "viem";
import { calcAddrFromPrivateKey } from "@/mocks/utils";
import logger from "@/utils/logger";

const MAX_PENDING_NONCE = 3n;

class PrivateKeyManagerMock implements IPrivateKeyManager {
  private privateKeys: Hex[];
  private addressMap: Record<Address, Hex>;
  private nonces: Record<
    Hex,
    {
      confirmed: bigint; // confirmed nonce
      latest: bigint; // latest nonce
    }
  >;
  private locked = false;
  private log = logger.child({}, { msgPrefix: "[km_mock] " });

  constructor() {
    this.privateKeys = ["0x1234", "0x5678"];
    this.nonces = {
      "0x1234": {
        confirmed: 0n,
        latest: 0n,
      },
      "0x5678": {
        confirmed: 0n,
        latest: 0n,
      },
    };
    this.addressMap = {};
    for (const privateKey of this.privateKeys) {
      const address = calcAddrFromPrivateKey(privateKey);
      this.addressMap[address] = privateKey;
    }
  }

  private async lock() {
    while (this.locked) {
      this.log.debug("waiting for lock");
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    this.locked = true;
  }

  private unlock() {
    if (!this.locked) {
      throw new Error("not locked");
    }
    this.locked = false;
  }

  private async getPendingNonce(privateKey: Hex): Promise<bigint | undefined> {
    await this.lock();
    try {
      const nonce = this.nonces[privateKey];
      if (nonce.latest - nonce.confirmed >= MAX_PENDING_NONCE) {
        return undefined;
      }
      return ++nonce.latest;
    } finally {
      this.unlock();
    }
  }

  async getNextPrivateKeyAndNonce() {
    while (true) {
      for (const privateKey of this.privateKeys) {
        const nonce = await this.getPendingNonce(privateKey);
        if (nonce !== undefined) {
          this.log.debug(
            "found available nonce; addr=%s, nonce=%s",
            calcAddrFromPrivateKey(privateKey),
            nonce
          );
          return { privateKey, nonce };
        }
      }
      this.log.debug("no available nonce, waiting");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async updateConfirmedNonce(privateKeyAddress: Address, nonce: bigint) {
    await this.lock();
    try {
      const key = this.addressMap[privateKeyAddress];
      if (key === undefined) {
        throw new Error(`unknown address; addr=${privateKeyAddress}`);
      }
      if (nonce > this.nonces[key].latest) {
        throw new Error(
          `invalid confirmed nonce; addr=${privateKeyAddress}, nonce=${nonce}, current_confirmed=${this.nonces[key].confirmed}`
        );
      }
      this.log.debug(
        "updating confirmed nonce; addr=%s, nonce=%s",
        privateKeyAddress,
        nonce
      );
      this.nonces[key].confirmed = nonce;
    } finally {
      this.unlock();
    }
  }

  async updateLatestNonce(privateKeyAddress: Address, nonce: bigint) {
    await this.lock();
    this.updateLatestNonceNoLock(privateKeyAddress, nonce);
    this.unlock();
  }

  updateLatestNonceNoLock(privateKeyAddress: Address, nonce: bigint) {
    const key = this.addressMap[privateKeyAddress];
    if (key === undefined) {
      throw new Error(`unknown address; addr=${privateKeyAddress}`);
    }
    this.log.debug(
      "updating latest nonce; addr=%s, nonce=%s",
      privateKeyAddress,
      nonce
    );
    if (nonce < this.nonces[key].confirmed) {
      throw new Error(
        `invalid latest nonce; addr=${privateKeyAddress}, nonce=${nonce}, current_confirmed=${this.nonces[key].confirmed}, current_latest=${this.nonces[key].latest}`
      );
    }
    this.nonces[key].latest = nonce;
  }
}

export default PrivateKeyManagerMock;

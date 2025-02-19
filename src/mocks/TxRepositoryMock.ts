import ITransaction, { TransactionStatus } from "@/interfaces/ITransaction";
import ITxRepository from "@/interfaces/ITxRepository";
import { Address, isAddressEqual } from "viem";
import logger from "@/utils/logger";

class TxRepositoryMock implements ITxRepository {
  private transactions: ITransaction[] = [];
  private log = logger.child({}, { msgPrefix: "[tx_repo_mock] " });

  async getEarliestSentTransactions(limit: number) {
    const sorted = this.transactions
      .filter((tx) => tx.status === TransactionStatus.Sent)
      .sort((a, b) => Number(a.blockNumber - b.blockNumber))
      .sort((a, b) => Number(a.nonce - b.nonce));
    return sorted.slice(0, limit);
  }

  async get(id: string) {
    return this.transactions.find((tx) => tx.id === id);
  }

  async getByPrivateKeyAddr(privateKeyAddr: Address) {
    return this.transactions
      .filter((tx) => isAddressEqual(tx.privateKeyAddr, privateKeyAddr))
      .sort((a, b) => Number(a.blockNumber - b.blockNumber))
      .sort((a, b) => Number(a.nonce - b.nonce));
  }

  async create(transaction: ITransaction) {
    this.log.debug("create transaction; tx=%o", transaction);
    this.transactions.push(transaction);
  }

  async update(transaction: ITransaction) {
    this.log.debug("update transaction; tx=%o", transaction);
    for (let i = 0; i < this.transactions.length; i++) {
      if (this.transactions[i].id === transaction.id) {
        this.transactions[i] = transaction;
        return;
      }
    }
  }

  async delete(id: string) {
    this.log.debug("delete transaction; id=%s", id);
    this.transactions = this.transactions.filter((tx) => tx.id !== id);
  }
}

export default TxRepositoryMock;

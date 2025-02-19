import ITransaction from "./ITransaction";
import { Address } from "viem";

interface ITxRepository {
  getEarliestSentTransactions(limit: number): Promise<ITransaction[]>;
  get(id: string): Promise<ITransaction>;
  getByPrivateKeyAddr(privateKeyAddr: Address): Promise<ITransaction[]>;
  create(transaction: ITransaction): Promise<void>;
  update(transaction: ITransaction): Promise<void>;
  delete(id: string): Promise<void>;
}

export default ITxRepository;

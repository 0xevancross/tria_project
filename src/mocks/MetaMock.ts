import IMeta from "@/interfaces/IMeta";
import { Address, Hex } from "viem";

// parse env into number
const SPEED = parseInt(process.env.SPEED || "1", 10);

class MetaMock implements IMeta {
  // share meta
  public pingContractAddress: Address =
    "0x1111111111111111111111111111111111111111";
  public pingTopicHash: Hex =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

  // monitoring bot meta
  public monitorInterval = 1000 / SPEED;
  public monitoringStep = 3;
  public monitoringProcessedHead = 0;

  // sending bot meta
  public maxRetryCount = 3;

  // reconciliation bot meta
  public reconciliationInterval = 1000 / SPEED;
  public reconciliationBatchSize = 10;
  public reconciliationTxTimeout = 5000 / SPEED;

  async save() {}
}

export default MetaMock;

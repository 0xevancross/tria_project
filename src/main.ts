import MonitoringBot from "@/apps/monitoring";
import SendingBot from "@/apps/sending";
import MessageQueueMock from "@/mocks/MessageQueueMock";
import MetaMock from "@/mocks/MetaMock";
import RPCMock from "@/mocks/RPCMock";
import TxRepositoryMock from "@/mocks/TxRepositoryMock";
import PrivateKeyManagerMock from "@/mocks/PrivateKeyManagerMock";
import ReconciliationBot from "@/apps/reconciliation";

const main = async () => {
  // dependencies
  const mq = new MessageQueueMock();
  const meta = new MetaMock();
  const rpc = new RPCMock(meta);
  const txRepo = new TxRepositoryMock();
  const km = new PrivateKeyManagerMock();

  // apps
  const monitoringBot = new MonitoringBot(mq, meta, rpc);
  const sendingBot = new SendingBot(mq, meta, rpc, txRepo, km);
  const reconciliationBot = new ReconciliationBot(mq, meta, rpc, txRepo, km);

  Promise.all([
    monitoringBot.main(),
    sendingBot.main(),
    reconciliationBot.main(),
  ]);
};

main();

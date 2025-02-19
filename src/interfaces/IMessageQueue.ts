import IMessage from "./IMessage";

interface IMessageQueue {
  send(message: IMessage): Promise<void>;
  subscribe(listener: (message: IMessage) => Promise<void>): Promise<void>;
}

export default IMessageQueue;

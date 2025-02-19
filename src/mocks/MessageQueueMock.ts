import IMessage from "@/interfaces/IMessage";
import IMessageQueue from "@/interfaces/IMessageQueue";

class MessaggeQueueMock implements IMessageQueue {
  private listeners: Array<(msg: IMessage) => Promise<void>> = [];

  async send(message: IMessage) {
    for (const listener of this.listeners) {
      await listener(message);
    }
  }

  async subscribe(listener: (message: IMessage) => Promise<void>) {
    this.listeners.push(listener);
  }
}

export default MessaggeQueueMock;

import { OnModuleInit } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { assert } from 'console';
import { Server } from 'socket.io';
import { LinesRepository } from 'src/lines/lines.repository';

@WebSocketGateway()
export class Gateway implements OnModuleInit {
  constructor (private readonly linesRepository: LinesRepository) {}

  @WebSocketServer()
  io: Server;

  onModuleInit() {
    this.io.on('connection', async (socket) => {
      await this.create(socket.id);
      socket.on('disconnect', async () => {
        await this.disconnect(socket.id);
        await this.delete(socket.id);
        console.log(socket.id + 'disconnected!');
        console.log(this.linesRepository.lines);
      });
      console.log(socket.id + 'connected!');
      console.log(this.linesRepository.lines);
    });
  }

  @SubscribeMessage('newMessage')
  async onnewMessage(@MessageBody() body: any) {
    console.log(body);
    this.io.emit('onMessage', {
      msg: 'New Message',
      content: body,
    });
  }

  // サイト接続
  async create(id: string): Promise<void> {
    assert((await this.linesRepository.findOne(id)).id1 === "");
    this.linesRepository.save({ id1: id, id2: "" });
  }

  // サイト切断
  async delete(id: string): Promise<void> {
    this.linesRepository.delete(id);
  }

  // ケーブル接続
  async connect(id1: string, id2: string): Promise<boolean> {
    const line1 = await this.linesRepository.findOne(id1);
    assert(line1.id1 === id1);
    if (line1.id2 !== "") {
      return false;
    }
    const line2 = await this.linesRepository.findOne(id2);
    if (line2.id1 === "" || line2.id2 !== "") {
      return false;
    }
    this.linesRepository.updateOne({ id1: id1, id2: id2 });
    this.linesRepository.updateOne({ id1: id2, id2: id1 });
    return true;
  }

  // ケーブル切断
  async disconnect(id: string): Promise<void> {
    const line1 = await this.linesRepository.findOne(id);
    assert(line1.id1 === id);
    if (line1.id2 === "") {
      return;
    }
    this.linesRepository.updateOne({ id1: id, id2: "" });

    const line2 = await this.linesRepository.findOne(line1.id2);
    if (line2.id1 === "" || line2.id2 !== id) {
      return;
    }
    this.linesRepository.updateOne({ id1: line2.id2, id2: "" });
  }
}

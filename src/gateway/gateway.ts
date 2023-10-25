import { OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { assert } from 'console';
import { Socket, Server } from 'socket.io';
import { LinesRepository } from 'src/lines/lines.repository';

@WebSocketGateway()
export class Gateway implements OnModuleInit {
  constructor (private readonly linesRepository: LinesRepository) {}

  @WebSocketServer()
  io: Server;

  onModuleInit() {
    this.io.on('connection', async (socket) => {
      await this.create(socket.id);
      socket.join(socket.id);
      console.log(socket.id + 'connected!');
      console.log(this.linesRepository.lines);
      socket.on('disconnect', async () => {
        const id2 = await this.disconnect(socket.id);
        await this.delete(socket.id);
        if (id2 !== "") socket.leave(id2);
        this.io.in(socket.id).socketsLeave(socket.id);
        console.log(socket.id + 'disconnected!');
        console.log(this.linesRepository.lines);
      });
    });
  }

  @SubscribeMessage('con')
  async onconnect(@MessageBody() id: string, @ConnectedSocket() socket: Socket) {
    if (await this.connect(socket.id, id)) {
      this.io.in(id).socketsJoin(socket.id);
      socket.join(id);
    }
    console.log(this.linesRepository.lines);
    this.io.emit('con', id);
  }

  @SubscribeMessage('discon')
  async ondisconnect(@ConnectedSocket() socket: Socket) {
    const id2 = await this.disconnect(socket.id);
    if (id2 !== "") socket.leave(id2);
    this.io.in(socket.id).socketsLeave(socket.id);
    socket.join(socket.id);
    console.log(this.linesRepository.lines);
    this.io.emit('discon');
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
  async disconnect(id: string): Promise<string> {
    const line1 = await this.linesRepository.findOne(id);
    assert(line1.id1 === id);
    if (line1.id2 === "") {
      return "";
    }
    const line2 = await this.linesRepository.findOne(line1.id2);
    if (line2.id1 === "" || line2.id2 !== id) {
      return "";
    }
    this.linesRepository.updateOne({ id1: id, id2: "" });
    this.linesRepository.updateOne({ id1: line1.id2, id2: "" });
    return line1.id2;
  }
}

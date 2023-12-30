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

@WebSocketGateway({
  maxHttpBufferSize: 500 * 1024 * 1024
})
export class Gateway implements OnModuleInit {
  constructor (private readonly linesRepository: LinesRepository) {}

  @WebSocketServer()
  io: Server;

  onModuleInit() {
    this.io.on('connection', async (socket) => {
      await this.create(socket.id);
      socket.join(socket.id);
      socket.on('disconnect', async () => {
        const id2 = await this.disconnect(socket.id);
        if (id2 !== "") {
          const socket2 = (await this.io.in(id2).fetchSockets()).find((s) => s.id === id2);
          socket.emit('leave');
          socket.leave(id2);
          if (socket2 !== undefined) {
            socket2.emit('leave');
            socket2.leave(socket.id);
          }
        }
        await this.delete(socket.id);
      });
    });
  }

  @SubscribeMessage('syncinit1')
  async onsyncinit1(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    if (socket.id !== data.id && await this.connect(socket.id, data.id)) {
      const socket2 = (await this.io.in(data.id).fetchSockets()).find((s) => s.id === data.id);
      if (socket2 !== undefined) {
        socket.join(data.id);
        socket2.emit('syncinit1', {id: socket.id, gameboy: data.gameboy});
        socket2.join(socket.id);
      }
    }
  }

  @SubscribeMessage('syncinit2')
  async onsyncinit2(@MessageBody() data: string, @ConnectedSocket() socket: Socket) {
    const socket2 = (await this.io.in(socket.id).fetchSockets()).find((s) => s.id !== socket.id);
    if (socket2 !== undefined) socket2.emit('syncinit2', {id: socket.id, gameboy: data});
  }

  @SubscribeMessage('leave')
  async onleave(@ConnectedSocket() socket: Socket) {
    const id2 = await this.disconnect(socket.id);
    if (id2 !== "") {
      const socket2 = (await this.io.in(id2).fetchSockets()).find((s) => s.id === id2);
      socket.emit('leave');
      socket.leave(id2);
      if (socket2 !== undefined) {
        socket2.emit('leave');
        socket2.leave(socket.id);
      }
    }
  }

  @SubscribeMessage('input_history')
  async oninput_history(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    const socket2 = (await this.io.in(socket.id).fetchSockets()).find((s) => s.id !== socket.id);
    if (socket2 !== undefined) socket2.emit('input_history', data);
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

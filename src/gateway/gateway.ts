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
      socket.on('disconnect', async () => {
        const id2 = await this.disconnect(socket.id);
        if (id2 !== "") {
          const socket2 = (await this.io.in(id2).fetchSockets()).find((s) => s.id === id2);
          assert(socket2 !== undefined);
          socket.emit('leave');
          socket2.emit('leave');
          socket.leave(id2);
          socket2.leave(socket.id);
        }
        await this.delete(socket.id);
      });
    });
  }

  @SubscribeMessage('join')
  async onjoin(@MessageBody() id: string, @ConnectedSocket() socket: Socket) {
    if (socket.id !== id && await this.connect(socket.id, id)) {
      const socket2 = (await this.io.in(id).fetchSockets()).find((s) => s.id === id);
      assert(socket2 !== undefined);
      socket.emit('join', id);
      socket2.emit('join', socket.id);
      socket.join(id);
      socket2.join(socket.id);
    }
  }

  @SubscribeMessage('leave')
  async onleave(@ConnectedSocket() socket: Socket) {
    const id2 = await this.disconnect(socket.id);
    if (id2 !== "") {
      const socket2 = (await this.io.in(id2).fetchSockets()).find((s) => s.id === id2);
      assert(socket2 !== undefined);
      socket.emit('leave');
      socket2.emit('leave');
      socket.leave(id2);
      socket2.leave(socket.id);
    }
  }

  @SubscribeMessage('master')
  async onmaster(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    const socket2 = (await this.io.in(socket.id).fetchSockets()).find((s) => s.id !== socket.id);
    if (socket2 === undefined) {
      socket.emit('slave', 0xFF);
    } else {
      socket2.emit('master', data);
    }
  }

  @SubscribeMessage('slave')
  async onslave(@MessageBody() data: number, @ConnectedSocket() socket: Socket) {
    const socket2 = (await this.io.in(socket.id).fetchSockets()).find((s) => s.id !== socket.id);
    assert(socket2 !== undefined);
    socket2.emit('slave', data);
  }

  // @SubscribeMessage('master_received')
  // async onmaster_received(@ConnectedSocket() socket: Socket) {
  //   const socket2 = (await this.io.in(socket.id).fetchSockets()).find((s) => s.id !== socket.id);
  //   assert(socket2 !== undefined);
  //   socket2.emit('master_received');
  // }

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

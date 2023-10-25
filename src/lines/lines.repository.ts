import { Injectable } from '@nestjs/common';
import { Line } from 'src/entities/line.entity';

// TODO: transaction

@Injectable()
export class LinesRepository {
  lines: Line[] = [{id1: 'abc', id2: ''}];
  
  async save(line: Line): Promise<void> {
    this.lines.push(line);
  }

  async delete(id: string): Promise<void> {
    let new_lines: Line[] = [];
    for (const _line of this.lines) {
      if (_line.id1 !== id) {
        new_lines.push(_line);
      }
    }
    this.lines = new_lines;
  }

  async findOne(id: string): Promise<Line>  {
    for (const _line of this.lines) {
      if (_line.id1 === id) {
        return _line;
      }
    }
    return { id1: "", id2: "" };
  }

  async updateOne(line: Line): Promise<void> {
    this.lines = this.lines.map((_line) => {
      if (_line.id1 === line.id1) {
        return line;
      }
      return _line;
    });
  }
}
import Dexie, { Table } from 'dexie';
import { AtelierClient, AtelierOrder } from '../types';

export class DarajaDexie extends Dexie {
  clients!: Table<AtelierClient>;
  orders!: Table<AtelierOrder>;

  constructor() {
    super('DarajaAtelierDB');
    this.version(1).stores({
      clients: '++id, username, clientName, phone', // primary key is auto-increment id, search by username, name, phone
      orders: '++id, clientUsername, status, priority, outfitName'
    });
  }
}

export const db = new DarajaDexie();

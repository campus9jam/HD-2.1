import { db_local, SyncAction } from './CacheService';

/**
 * SyncService: Orchestrates the reconciliation of local offline 
 * actions with the sovereign cloud ledger.
 */
export const SyncService = {
  /**
   * Queues an action to be performed when online.
   */
  async queueAction(type: SyncAction['type'], payload: any): Promise<void> {
    await db_local.syncQueue.add({
      type,
      payload,
      timestamp: Date.now()
    });
    console.log(`[Sync] Action queued: ${type}`);
  },

  /**
   * Processes all pending actions in the queue.
   */
  async processQueue(handlers: { [K in SyncAction['type']]?: (payload: any) => Promise<void> }): Promise<void> {
    const pending = await db_local.syncQueue.toArray();
    if (pending.length === 0) return;

    console.log(`[Sync] Processing ${pending.length} pending actions...`);

    for (const action of pending) {
      const handler = handlers[action.type];
      if (handler) {
        try {
          await handler(action.payload);
          if (action.id) await db_local.syncQueue.delete(action.id);
        } catch (e) {
          console.error(`[Sync] Failed to process action ${action.id}:`, e);
          // Keep in queue for next attempt
        }
      } else {
        console.warn(`[Sync] No handler for action type: ${action.type}`);
        if (action.id) await db_local.syncQueue.delete(action.id);
      }
    }
  },

  /**
   * Checks if there are any pending actions.
   */
  async hasPending(): Promise<boolean> {
    const count = await db_local.syncQueue.count();
    return count > 0;
  }
};

import { Wallet, Transaction } from '../../types';
import { ConflictResolution } from './types';

type Entity = Wallet | Transaction;

function isWallet(entity: Entity): entity is Wallet {
  return 'balance' in entity && 'isActive' in entity;
}

export function resolveConflict(
  localEntity: Entity,
  serverEntity: Entity,
  strategy: 'server_wins' | 'client_wins' | 'merge' = 'server_wins'
): ConflictResolution {
  switch (strategy) {
    case 'server_wins':
      return {
        strategy: 'server_wins',
        resolvedData: serverEntity,
        conflictDetails: `Server version used for ${isWallet(localEntity) ? 'wallet' : 'transaction'}`,
      };

    case 'client_wins':
      return {
        strategy: 'client_wins',
        resolvedData: localEntity,
        conflictDetails: `Local version preserved for ${isWallet(localEntity) ? 'wallet' : 'transaction'}`,
      };

    case 'merge':
      return resolveWithMerge(localEntity, serverEntity);
  }
}

function resolveWithMerge(localEntity: Entity, serverEntity: Entity): ConflictResolution {
  if (isWallet(localEntity) && isWallet(serverEntity)) {
    const merged: Wallet = { ...serverEntity };
    if (new Date(localEntity.updatedAt) > new Date(serverEntity.updatedAt)) {
      merged.name = localEntity.name;
      merged.icon = localEntity.icon;
      merged.color = localEntity.color;
    }
    merged.balance = serverEntity.balance;
    return {
      strategy: 'merge',
      resolvedData: merged,
      conflictDetails: 'Wallet metadata from newer version, balance from server',
    };
  }

  if (new Date(localEntity.updatedAt) > new Date(serverEntity.updatedAt)) {
    return {
      strategy: 'merge',
      resolvedData: localEntity,
      conflictDetails: 'Local version is newer, keeping local changes',
    };
  }

  return {
    strategy: 'merge',
    resolvedData: serverEntity,
    conflictDetails: 'Server version is newer, keeping server changes',
  };
}

export function detectConflict(
  localEntity: Entity,
  serverUpdatedAt: string
): boolean {
  if (!localEntity.serverId) {
    return false;
  }

  const localUpdatedAt = new Date(localEntity.updatedAt);
  const serverTime = new Date(serverUpdatedAt);

  return localUpdatedAt > serverTime;
}

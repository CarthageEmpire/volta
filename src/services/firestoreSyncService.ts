import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppState, UserAccount } from '../types';
import { db } from './firebaseApp';

const APP_STATE_ITEM_ID = 'app-state';
const PROFILE_ITEM_ID = 'profile';

type SyncPayload<T> = {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
  data: T;
};

const lastUploadedAtByUser = new Map<string, number>();

function buildItemRef(uid: string, itemId: string) {
  return doc(db, 'users', uid, 'items', itemId);
}

function sanitizeStateForCloud(state: AppState): AppState {
  return {
    ...state,
    verificationRequests: state.verificationRequests.map((request) => ({
      ...request,
      documents: request.documents.map(({ file: _file, ...document }) => document),
    })),
  };
}

function normalizeUsersForSession(state: AppState, uid: string): AppState {
  const users = state.users.filter((user) => user.id === uid);
  return {
    ...state,
    users,
  };
}

export async function backupUserProfileToCloud(uid: string, profile: UserAccount) {
  const now = Date.now();
  const ref = buildItemRef(uid, PROFILE_ITEM_ID);

  try {
    const existing = await getDoc(ref);
    const createdAt = existing.exists()
      ? Number((existing.data() as Partial<SyncPayload<UserAccount>>).createdAt ?? now)
      : now;

    const payload: SyncPayload<UserAccount> = {
      id: PROFILE_ITEM_ID,
      userId: uid,
      createdAt,
      updatedAt: now,
      synced: true,
      data: {
        ...profile,
        id: profile.id || uid,
      },
    };

    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    console.error('[sync] backupUserProfileToCloud failed', { uid, error });
  }
}

export async function pullCloudState(uid: string): Promise<{ state: AppState | null; updatedAt: number }> {
  const ref = buildItemRef(uid, APP_STATE_ITEM_ID);

  try {
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return { state: null, updatedAt: 0 };
    }

    const payload = snapshot.data() as Partial<SyncPayload<AppState>>;
    if (!payload.data) {
      return { state: null, updatedAt: 0 };
    }

    return {
      state: normalizeUsersForSession(payload.data, uid),
      updatedAt: Number(payload.updatedAt ?? 0),
    };
  } catch (error) {
    console.error('[sync] pullCloudState failed', { uid, error });
    return { state: null, updatedAt: 0 };
  }
}

export async function pushLocalStateToCloud(params: {
  uid: string;
  state: AppState;
  localUpdatedAt: number;
}) {
  const { uid, state, localUpdatedAt } = params;
  const lastUploadedAt = lastUploadedAtByUser.get(uid) ?? 0;

  if (!localUpdatedAt || localUpdatedAt <= lastUploadedAt) {
    return;
  }

  const ref = buildItemRef(uid, APP_STATE_ITEM_ID);
  const now = Date.now();

  try {
    const existing = await getDoc(ref);
    const existingData = existing.data() as Partial<SyncPayload<AppState>> | undefined;
    const remoteUpdatedAt = Number(existingData?.updatedAt ?? 0);

    if (remoteUpdatedAt > localUpdatedAt) {
      return;
    }

    const payload: SyncPayload<AppState> = {
      id: APP_STATE_ITEM_ID,
      userId: uid,
      createdAt: existing.exists() ? Number(existingData?.createdAt ?? now) : now,
      updatedAt: localUpdatedAt,
      synced: true,
      data: sanitizeStateForCloud(normalizeUsersForSession(state, uid)),
    };

    await setDoc(ref, payload, { merge: true });
    lastUploadedAtByUser.set(uid, localUpdatedAt);
  } catch (error) {
    console.error('[sync] pushLocalStateToCloud failed', { uid, error });
  }
}

export function mergeByLatestUpdatedAt(params: {
  localState: AppState;
  localUpdatedAt: number;
  cloudState: AppState | null;
  cloudUpdatedAt: number;
}) {
  const { localState, localUpdatedAt, cloudState, cloudUpdatedAt } = params;

  if (!cloudState) {
    return {
      state: localState,
      updatedAt: localUpdatedAt,
      source: 'local' as const,
    };
  }

  if (cloudUpdatedAt > localUpdatedAt) {
    return {
      state: cloudState,
      updatedAt: cloudUpdatedAt,
      source: 'cloud' as const,
    };
  }

  return {
    state: localState,
    updatedAt: localUpdatedAt,
    source: 'local' as const,
  };
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { VideoCreation, User, AIModelConfig, UserAnalytics } from '../types';

const DB_NAME = 'PixshopDB';
const DB_VERSION = 3;
const STORE_NAME = 'videos';
const USER_STORE_NAME = 'users';
const MODEL_STORE_NAME = 'models';
const SETTINGS_STORE_NAME = 'settings';

let db: IDBDatabase;

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB.'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create videos store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const videoStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        videoStore.createIndex('userId', 'userId', { unique: false });
        videoStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Create users store
      if (!db.objectStoreNames.contains(USER_STORE_NAME)) {
        const userStore = db.createObjectStore(USER_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('role', 'role', { unique: false });
      }
      
      // Create models store
      if (!db.objectStoreNames.contains(MODEL_STORE_NAME)) {
        const modelStore = db.createObjectStore(MODEL_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        modelStore.createIndex('name', 'name', { unique: true });
        modelStore.createIndex('isActive', 'isActive', { unique: false });
      }
      
      // Create settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        const settingsStore = db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
        // Initialize default settings
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const store = transaction.objectStore(SETTINGS_STORE_NAME);
          store.add({ key: 'siteAccessEnabled', value: true, updatedAt: Date.now() });
        }
      }
    };
  });
}

export async function addVideo(video: Omit<VideoCreation, 'id' | 'url'>): Promise<number> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(video);

        request.onsuccess = () => {
            resolve(request.result as number);
        };
        request.onerror = () => {
            reject(new Error('Failed to add video to DB.'));
        };
    });
}

export async function getAllVideos(): Promise<VideoCreation[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const videos: Omit<VideoCreation, 'url'>[] = request.result.reverse();
            // Create blob URLs for each video
            const videosWithUrls = videos.map(v => ({
                ...v,
                url: URL.createObjectURL(v.videoBlob)
            }));
            resolve(videosWithUrls);
        };
        request.onerror = () => {
            reject(new Error('Failed to retrieve videos from DB.'));
        };
    });
}

export async function deleteVideo(id: number): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(new Error('Failed to delete video from DB.'));
        };
    });
}

// User Management Functions
export async function addUser(user: Omit<User, 'id'>): Promise<number> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(USER_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(USER_STORE_NAME);
        const request = store.add(user);

        request.onsuccess = () => {
            resolve(request.result as number);
        };
        request.onerror = () => {
            reject(new Error('Failed to add user to DB.'));
        };
    });
}

export async function getUserById(id: number): Promise<User | null> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(USER_STORE_NAME, 'readonly');
        const store = transaction.objectStore(USER_STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = () => {
            reject(new Error('Failed to get user from DB.'));
        };
    });
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(USER_STORE_NAME, 'readonly');
        const store = transaction.objectStore(USER_STORE_NAME);
        const index = store.index('email');
        const request = index.get(email);

        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = () => {
            reject(new Error('Failed to get user by email from DB.'));
        };
    });
}

export async function getAllUsers(): Promise<User[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(USER_STORE_NAME, 'readonly');
        const store = transaction.objectStore(USER_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };
        request.onerror = () => {
            reject(new Error('Failed to get all users from DB.'));
        };
    });
}

export async function updateUserLastLogin(id: number): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(USER_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(USER_STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const user = getRequest.result;
            if (user) {
                user.lastLogin = Date.now();
                const putRequest = store.put(user);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(new Error('Failed to update user last login.'));
            } else {
                reject(new Error('User not found.'));
            }
        };
        getRequest.onerror = () => {
            reject(new Error('Failed to get user for last login update.'));
        };
    });
}

export async function deleteUser(id: number): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(USER_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(USER_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(new Error('Failed to delete user from DB.'));
        };
    });
}

// AI Model Management Functions
export async function addAIModel(model: Omit<AIModelConfig, 'id'>): Promise<number> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MODEL_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(MODEL_STORE_NAME);
        const request = store.add(model);

        request.onsuccess = () => {
            resolve(request.result as number);
        };
        request.onerror = () => {
            reject(new Error('Failed to add AI model to DB.'));
        };
    });
}

export async function getAllAIModels(): Promise<AIModelConfig[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MODEL_STORE_NAME, 'readonly');
        const store = transaction.objectStore(MODEL_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };
        request.onerror = () => {
            reject(new Error('Failed to get AI models from DB.'));
        };
    });
}

export async function updateAIModel(model: AIModelConfig): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MODEL_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(MODEL_STORE_NAME);
        const request = store.put(model);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(new Error('Failed to update AI model in DB.'));
        };
    });
}

export async function deleteAIModel(id: number): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MODEL_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(MODEL_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(new Error('Failed to delete AI model from DB.'));
        };
    });
}

// Analytics Functions
export async function getUserAnalytics(): Promise<UserAnalytics> {
    const db = await initDB();
    
    const users = await getAllUsers();
    const videos = await getAllVideos();
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const activeUsers = users.filter(user => 
        user.lastLogin && user.lastLogin > oneWeekAgo
    ).length;
    
    const videosToday = videos.filter(video => video.timestamp > oneDayAgo).length;
    const videosThisWeek = videos.filter(video => video.timestamp > oneWeekAgo).length;
    const videosThisMonth = videos.filter(video => video.timestamp > oneMonthAgo).length;
    
    return {
        totalUsers: users.length,
        activeUsers,
        totalVideos: videos.length,
        videosToday,
        videosThisWeek,
        videosThisMonth
    };
}

// Get videos by user ID
export async function getVideosByUserId(userId: number): Promise<VideoCreation[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('userId');
        const request = index.getAll(userId);

        request.onsuccess = () => {
            const videos: Omit<VideoCreation, 'url'>[] = request.result.reverse();
            const videosWithUrls = videos.map(v => ({
                ...v,
                url: URL.createObjectURL(v.videoBlob)
            }));
            resolve(videosWithUrls);
        };
        request.onerror = () => {
            reject(new Error('Failed to retrieve user videos from DB.'));
        };
    });
}

// Settings Management Functions
export async function getSetting(key: string): Promise<any> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.value : null);
        };
        request.onerror = () => {
            reject(new Error('Failed to get setting from DB.'));
        };
    });
}

export async function setSetting(key: string, value: any): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE_NAME);
        const request = store.put({ key, value, updatedAt: Date.now() });

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(new Error('Failed to set setting in DB.'));
        };
    });
}

// Site Access Control Functions
export async function isSiteAccessEnabled(): Promise<boolean> {
    try {
        const enabled = await getSetting('siteAccessEnabled');
        return enabled !== null ? enabled : true; // Default to enabled if not set
    } catch (error) {
        console.error('Error checking site access:', error);
        return true; // Default to enabled on error
    }
}

export async function setSiteAccess(enabled: boolean): Promise<void> {
    return setSetting('siteAccessEnabled', enabled);
}

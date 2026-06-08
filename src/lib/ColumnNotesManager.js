/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import ServerConfigStorage from './ServerConfigStorage';

/**
 * 内存缓存，页面生命周期内持久化
 * 结构: { appId: { className: { columnName: noteText } } }
 */
const notesCache = {};

const KEY_PREFIX = 'browser.columnNotes.';

/**
 * 列备注管理器 — 基于 ServerConfigStorage，每个 class 存一条记录
 * key: browser.columnNotes.{className}
 * value: { col1: "备注1", col2: "备注2", ... }
 */
export default class ColumnNotesManager {
  constructor(app) {
    this.app = app;
    this.serverStorage = new ServerConfigStorage(app);
  }

  /**
   * 获取某个 class 的所有列备注
   * @returns {Promise<Object>} { columnName: noteText, ... }
   */
  async getNotes(appId, className) {
    const cached = notesCache[appId]?.[className];
    // 缓存命中且非空对象时直接返回；空对象不缓存，避免 deleteConfig 后残留
    if (cached && Object.keys(cached).length > 0) {
      return { ...cached };
    }

    try {
      const notes = await this.serverStorage.getConfig(
        `${KEY_PREFIX}${className}`,
        appId
      );
      const result = notes && typeof notes === 'object' ? notes : {};

      if (!notesCache[appId]) {
        notesCache[appId] = {};
      }
      notesCache[appId][className] = result;

      return { ...result };
    } catch (error) {
      console.error('Failed to get column notes from server:', error);
      return {};
    }
  }

  /**
   * 设置某列的备注（空字符串表示删除该列的备注）
   */
  async setNote(appId, className, columnName, noteText) {
    try {
      const notes = await this.getNotes(appId, className);

      if (noteText && noteText.trim()) {
        notes[columnName] = noteText.trim();
      } else {
        delete notes[columnName];
      }

      const key = `${KEY_PREFIX}${className}`;

      if (Object.keys(notes).length === 0) {
        // 所有备注都清空了，删除服务端记录并清除缓存
        await this.serverStorage.deleteConfig(key, appId);
        if (notesCache[appId]) {
          delete notesCache[appId][className];
        }
      } else {
        await this.serverStorage.setConfig(key, notes, appId);
        if (!notesCache[appId]) {
          notesCache[appId] = {};
        }
        notesCache[appId][className] = notes;
      }
    } catch (error) {
      console.error('Failed to save column note:', error);
      throw error;
    }
  }

  /**
   * 清除内存缓存（切换 app 时调用）
   */
  static clearCache(appId) {
    if (appId) {
      delete notesCache[appId];
    } else {
      Object.keys(notesCache).forEach(k => delete notesCache[k]);
    }
  }
}

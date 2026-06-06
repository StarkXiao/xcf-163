const STORAGE_KEY = 'cyber_harbor_save';

export class Storage {
  static save(data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (e) {
      console.error('保存失败:', e);
      return false;
    }
  }

  static load() {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('读取失败:', e);
      return null;
    }
  }

  static clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('清除失败:', e);
      return false;
    }
  }

  static hasSave() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
}

export class ResourceLoader {
  constructor() {
    this.totalResources = 10;
    this.loadedCount = 0;
    this.onProgress = null;
    this.onComplete = null;
  }

  async load(onProgress, onComplete) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.loadedCount = 0;

    await this.simulateLoading();

    if (this.onComplete) {
      this.onComplete();
    }
  }

  async simulateLoading() {
    const loadSteps = [
      { name: '初始化渲染引擎', delay: 200 },
      { name: '加载赛博渔港场景', delay: 300 },
      { name: '解析机械残骸数据', delay: 200 },
      { name: '编译着色器程序', delay: 250 },
      { name: '加载粒子系统', delay: 200 },
      { name: '初始化物理引擎', delay: 150 },
      { name: '加载音频资源', delay: 200 },
      { name: '同步本地存档', delay: 300 },
      { name: '准备神经网络', delay: 250 },
      { name: '启动完成', delay: 100 }
    ];

    for (let i = 0; i < loadSteps.length; i++) {
      await this.wait(loadSteps[i].delay);
      this.loadedCount++;
      this.updateProgress();
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateProgress() {
    const progress = Math.floor((this.loadedCount / this.totalResources) * 100);
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
}

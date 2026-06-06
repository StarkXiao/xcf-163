import * as PIXI from 'pixi.js';

export class MapScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.bgLayers = [];
    this.floatingObjects = [];
    this.net = null;
    this.isNetActive = false;
    this.netAnimation = null;
    this.boat = null;
    this.rainParticles = [];
    this.time = 0;
    this.currentTide = null;
    this.tideOverlay = null;
    this.baseRainSpeed = 8;
    this.baseWaveAmplitude = 3;
    this.baseFloatSpeed = 0.02;

    this.currentNightEvent = null;
    this.nightEventOverlay = null;
    this.auroraParticles = [];
    this.emergencyLights = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.eventParticles = [];

    this.init();
  }

  init() {
    this.app.stage.addChild(this.container);

    this.createBackground();
    this.createRain();
    this.createFloatingObjects();
    this.createBoat();
    this.createNet();
    this.createTideOverlay();
    this.createNightEventOverlay();

    this.app.ticker.add(this.update.bind(this));
  }

  createTideOverlay() {
    this.tideOverlay = new PIXI.Graphics();
    this.tideOverlay.alpha = 0;
    this.container.addChild(this.tideOverlay);
  }

  createNightEventOverlay() {
    this.nightEventOverlay = new PIXI.Graphics();
    this.nightEventOverlay.alpha = 0;
    this.container.addChild(this.nightEventOverlay);

    for (let i = 0; i < 20; i++) {
      const particle = new PIXI.Graphics();
      particle.visible = false;
      this.container.addChild(particle);
      this.eventParticles.push({
        sprite: particle,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        color: 0xffffff
      });
    }
  }

  applyNightVoyageEvent(event, branch = null) {
    if (!event) return;
    this.currentNightEvent = { event, branch };
    const ambience = event.ambience || {};

    if (this.nightEventOverlay) {
      this.nightEventOverlay.clear();
      this.nightEventOverlay.beginFill(event.bgTint || 0x220022, 0.35);
      this.nightEventOverlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
      this.nightEventOverlay.endFill();
      this.nightEventOverlay.alpha = 0.6;
    }

    const rainIntensity = ambience.rainIntensity || 1.0;
    const waveIntensity = ambience.waveIntensity || 1.0;
    const floatIntensity = ambience.floatIntensity || 1.0;

    this.rainParticles.forEach(rain => {
      rain.sprite.alpha = 0.2 * rainIntensity;
      rain.speed = (this.baseRainSpeed + Math.random() * 5) * rainIntensity;
    });

    this.floatingObjects.forEach(obj => {
      if (obj.type === 'wave') {
        obj.amplitude = (this.baseWaveAmplitude + obj.offset * 0.2) * waveIntensity;
        obj.frequency = (0.02 + obj.offset * 0.003) * waveIntensity;
        obj.speed = (0.5 + obj.offset * 0.1) * waveIntensity;
      } else if (obj.type === 'debris') {
        obj.floatSpeed = (this.baseFloatSpeed + Math.random() * 0.01) * floatIntensity;
        obj.floatAmplitude = (10 + Math.random() * 10) * floatIntensity;
        obj.horizontalSpeed = (0.2 + Math.random() * 0.2) * floatIntensity;
      }
    });

    if (ambience.auroraEffect) {
      this.createAuroraEffect(event.color);
    } else {
      this.clearAuroraEffect();
    }

    if (ambience.shakeIntensity) {
      this.screenShake.intensity = ambience.shakeIntensity;
    }

    this.createEmergencyLights(event.color);
    this.spawnEventParticles(event.color, 15);
  }

  clearNightVoyageEvent() {
    this.currentNightEvent = null;

    if (this.nightEventOverlay) {
      this.nightEventOverlay.clear();
      this.nightEventOverlay.alpha = 0;
    }

    this.clearAuroraEffect();
    this.clearEmergencyLights();
    this.screenShake.intensity = 0;
    this.container.x = 0;
    this.container.y = 0;

    if (this.currentTide) {
      this.applyTideEffect(this.currentTide);
    } else {
      this.rainParticles.forEach(rain => {
        rain.sprite.alpha = 0.3;
        rain.speed = this.baseRainSpeed + Math.random() * 5;
      });
      this.floatingObjects.forEach(obj => {
        if (obj.type === 'wave') {
          obj.amplitude = this.baseWaveAmplitude + obj.offset * 0.2;
          obj.frequency = 0.02 + obj.offset * 0.003;
          obj.speed = 0.5 + obj.offset * 0.1;
        } else if (obj.type === 'debris') {
          obj.floatSpeed = this.baseFloatSpeed + Math.random() * 0.01;
          obj.floatAmplitude = 10 + Math.random() * 10;
          obj.horizontalSpeed = 0.2 + Math.random() * 0.2;
        }
      });
    }
  }

  createAuroraEffect(color = 0xaa44ff) {
    this.clearAuroraEffect();
    for (let i = 0; i < 5; i++) {
      const aurora = new PIXI.Graphics();
      aurora.y = this.app.screen.height * 0.1 + i * 30;
      aurora.alpha = 0.15 + Math.random() * 0.1;
      this.container.addChild(aurora);
      this.auroraParticles.push({
        graphics: aurora,
        offset: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.005,
        amplitude: 30 + Math.random() * 40,
        width: this.app.screen.width,
        color: color
      });
    }
  }

  clearAuroraEffect() {
    this.auroraParticles.forEach(a => {
      if (a.graphics && a.graphics.parent) {
        a.graphics.parent.removeChild(a.graphics);
      }
    });
    this.auroraParticles = [];
  }

  createEmergencyLights(color = 0xff4444) {
    this.clearEmergencyLights();
    for (let i = 0; i < 3; i++) {
      const light = new PIXI.Graphics();
      light.beginFill(color, 0.08);
      light.drawCircle(0, 0, 150 + i * 50);
      light.endFill();
      light.x = this.app.screen.width * (0.2 + i * 0.3);
      light.y = this.app.screen.height * (0.3 + (i % 2) * 0.3);
      light.alpha = 0;
      this.container.addChild(light);
      this.emergencyLights.push({
        graphics: light,
        speed: 0.03 + i * 0.01,
        offset: i * Math.PI / 1.5,
        baseX: light.x,
        baseY: light.y
      });
    }
  }

  clearEmergencyLights() {
    this.emergencyLights.forEach(l => {
      if (l.graphics && l.graphics.parent) {
        l.graphics.parent.removeChild(l.graphics);
      }
    });
    this.emergencyLights = [];
  }

  spawnEventParticles(color, count = 10) {
    for (let i = 0; i < count; i++) {
      const p = this.eventParticles.find(p => !p.sprite.visible);
      if (!p) continue;

      p.sprite.clear();
      p.sprite.beginFill(color, 0.8);
      p.sprite.drawCircle(0, 0, 2 + Math.random() * 3);
      p.sprite.endFill();

      p.sprite.x = Math.random() * this.app.screen.width;
      p.sprite.y = this.app.screen.height * (0.3 + Math.random() * 0.5);
      p.vx = (Math.random() - 0.5) * 3;
      p.vy = -1 - Math.random() * 2;
      p.life = 60 + Math.random() * 60;
      p.maxLife = p.life;
      p.color = color;
      p.sprite.visible = true;
    }
  }

  applyTideEffect(tidePhase) {
    if (!tidePhase) return;
    
    this.currentTide = tidePhase;
    
    if (this.tideOverlay) {
      this.tideOverlay.clear();
      this.tideOverlay.beginFill(tidePhase.bgTint, 0.4);
      this.tideOverlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
      this.tideOverlay.endFill();
      this.tideOverlay.alpha = 0.5;
    }
    
    const intensityMap = {
      'calm_sea': { rain: 0.3, wave: 0.6, float: 0.7 },
      'low_tide': { rain: 0.5, wave: 0.7, float: 0.8 },
      'ebb_tide': { rain: 0.7, wave: 0.9, float: 0.9 },
      'neap_tide': { rain: 0.6, wave: 0.8, float: 0.85 },
      'flood_tide': { rain: 1.0, wave: 1.1, float: 1.1 },
      'high_tide': { rain: 1.2, wave: 1.3, float: 1.2 },
      'spring_tide': { rain: 1.5, wave: 1.6, float: 1.4 },
      'storm_tide': { rain: 2.5, wave: 2.2, float: 1.8 }
    };
    
    const intensity = intensityMap[tidePhase.id] || { rain: 1.0, wave: 1.0, float: 1.0 };
    
    this.rainParticles.forEach(rain => {
      rain.sprite.alpha = 0.2 * intensity.rain;
      rain.speed = (this.baseRainSpeed + Math.random() * 5) * intensity.rain;
    });
    
    this.floatingObjects.forEach(obj => {
      if (obj.type === 'wave') {
        obj.amplitude = (this.baseWaveAmplitude + obj.offset * 0.2) * intensity.wave;
        obj.frequency = (0.02 + obj.offset * 0.003) * intensity.wave;
        obj.speed = (0.5 + obj.offset * 0.1) * intensity.wave;
      } else if (obj.type === 'debris') {
        obj.floatSpeed = (this.baseFloatSpeed + Math.random() * 0.01) * intensity.float;
        obj.floatAmplitude = (10 + Math.random() * 10) * intensity.float;
        obj.horizontalSpeed = (0.2 + Math.random() * 0.2) * intensity.float;
      }
    });
  }

  createBackground() {
    const skyGradient = new PIXI.Graphics();
    const skyHeight = this.app.screen.height * 0.4;
    
    skyGradient.beginFill(0x0a0a2a);
    skyGradient.drawRect(0, 0, this.app.screen.width, skyHeight);
    skyGradient.endFill();
    
    const skyTexture = this.generateSkyTexture();
    const sky = new PIXI.Sprite(skyTexture);
    sky.width = this.app.screen.width;
    sky.height = skyHeight;
    this.container.addChild(sky);
    this.bgLayers.push({ sprite: sky, speed: 0.1 });
    
    this.createCitySilhouette();
    
    const seaGradient = new PIXI.Graphics();
    seaGradient.beginFill(0x0a1a3a);
    seaGradient.drawRect(0, skyHeight, this.app.screen.width, this.app.screen.height - skyHeight);
    seaGradient.endFill();
    this.container.addChild(seaGradient);
    
    this.createWaterSurface(skyHeight);
    this.createWaterWaves(skyHeight);
  }

  generateSkyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#05051a');
    gradient.addColorStop(0.3, '#0a0a3a');
    gradient.addColorStop(0.6, '#1a0a4a');
    gradient.addColorStop(1, '#2a1a5a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 200;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.8 + 0.2;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
    
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 180 + 20;
      const width = Math.random() * 60 + 20;
      const height = Math.random() * 15 + 5;
      const alpha = Math.random() * 0.3 + 0.1;
      const hue = Math.random() > 0.5 ? 300 : 180;
      
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
      ctx.fillRect(x, y, width, height);
      
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, y, width, height);
      ctx.shadowBlur = 0;
    }
    
    return PIXI.Texture.from(canvas);
  }

  createCitySilhouette() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    const buildings = [];
    let x = 0;
    while (x < 1024) {
      const width = Math.random() * 40 + 20;
      const height = Math.random() * 120 + 40;
      buildings.push({ x, width, height });
      x += width + Math.random() * 10;
    }
    
    ctx.fillStyle = '#050515';
    buildings.forEach(b => {
      ctx.fillRect(b.x, 200 - b.height, b.width, b.height);
      
      const windowRows = Math.floor(b.height / 20);
      const windowCols = Math.floor(b.width / 12);
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          if (Math.random() > 0.3) {
            const wx = b.x + col * 12 + 3;
            const wy = 200 - b.height + row * 20 + 5;
            const isCyan = Math.random() > 0.5;
            ctx.fillStyle = isCyan 
              ? `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.3})`
              : `rgba(255, 0, 255, ${Math.random() * 0.5 + 0.3})`;
            ctx.fillRect(wx, wy, 6, 10);
          }
        }
      }
    });
    
    const texture = PIXI.Texture.from(canvas);
    const city = new PIXI.Sprite(texture);
    city.width = this.app.screen.width * 2;
    city.height = 150;
    city.y = this.app.screen.height * 0.3;
    this.container.addChild(city);
    this.bgLayers.push({ sprite: city, speed: 0.3 });
  }

  createWaterSurface(baseY) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 50, 150, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 64);
    
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 64;
      const length = Math.random() * 30 + 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y);
      ctx.strokeStyle = `rgba(0, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    const texture = PIXI.Texture.from(canvas);
    const water = new PIXI.TilingSprite(texture, this.app.screen.width, 64);
    water.y = baseY;
    this.container.addChild(water);
    this.bgLayers.push({ sprite: water, speed: 1, isTiling: true });
  }

  createWaterWaves(baseY) {
    for (let i = 0; i < 8; i++) {
      const wave = new PIXI.Graphics();
      wave.y = baseY + 30 + i * 20;
      wave.alpha = 0.1 + i * 0.02;
      this.container.addChild(wave);
      this.floatingObjects.push({
        type: 'wave',
        graphics: wave,
        offset: i * Math.PI / 4,
        amplitude: 3 + i * 0.5,
        frequency: 0.02 + i * 0.003,
        speed: 0.5 + i * 0.1
      });
    }
  }

  createRain() {
    for (let i = 0; i < 60; i++) {
      const rain = new PIXI.Graphics();
      rain.lineStyle(1, 0x88ccff, 0.3);
      rain.moveTo(0, 0);
      rain.lineTo(0, Math.random() * 15 + 10);
      rain.x = Math.random() * this.app.screen.width;
      rain.y = Math.random() * this.app.screen.height;
      this.container.addChild(rain);
      this.rainParticles.push({
        sprite: rain,
        speed: Math.random() * 5 + 8
      });
    }
  }

  createFloatingObjects() {
    const floatIcons = ['⚓', '🔧', '💡', '🔩', '📡', '⚡'];
    for (let i = 0; i < 8; i++) {
      const text = new PIXI.Text(floatIcons[i % floatIcons.length], {
        fontSize: 24,
        fill: 0x00ffff,
        alpha: 0.6
      });
      text.x = Math.random() * this.app.screen.width;
      text.y = this.app.screen.height * 0.5 + Math.random() * (this.app.screen.height * 0.4);
      text.anchor.set(0.5);
      this.container.addChild(text);
      this.floatingObjects.push({
        type: 'debris',
        sprite: text,
        baseX: text.x,
        baseY: text.y,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: Math.random() * 0.02 + 0.01,
        floatAmplitude: Math.random() * 15 + 5,
        horizontalSpeed: Math.random() * 0.3 + 0.1
      });
    }
  }

  createBoat() {
    const boatContainer = new PIXI.Container();
    boatContainer.x = this.app.screen.width * 0.5;
    boatContainer.y = this.app.screen.height * 0.42;
    boatContainer.pivot.set(0.5);
    
    const hull = new PIXI.Graphics();
    hull.beginFill(0x2a2a4a);
    hull.lineStyle(2, 0x00ffff);
    hull.moveTo(-60, 0);
    hull.lineTo(60, 0);
    hull.lineTo(45, 25);
    hull.lineTo(-45, 25);
    hull.closePath();
    hull.endFill();
    
    hull.beginFill(0x1a1a3a);
    hull.lineStyle(2, 0xff00ff);
    hull.drawRect(-30, -20, 60, 20);
    hull.endFill();
    
    const window1 = new PIXI.Graphics();
    window1.beginFill(0x00ffff, 0.5);
    window1.drawRect(-25, -15, 12, 10);
    window1.endFill();
    
    const window2 = new PIXI.Graphics();
    window2.beginFill(0x00ffff, 0.5);
    window2.drawRect(13, -15, 12, 10);
    window2.endFill();
    
    const light = new PIXI.Graphics();
    light.beginFill(0xffff00);
    light.drawCircle(0, -25, 5);
    light.endFill();
    
    const glow = new PIXI.Graphics();
    glow.beginFill(0xffff00, 0.3);
    glow.drawCircle(0, -25, 15);
    glow.endFill();
    
    boatContainer.addChild(hull);
    boatContainer.addChild(window1);
    boatContainer.addChild(window2);
    boatContainer.addChild(glow);
    boatContainer.addChild(light);
    
    this.container.addChild(boatContainer);
    this.boat = boatContainer;
  }

  createNet() {
    this.net = new PIXI.Container();
    this.net.visible = false;
    this.container.addChild(this.net);
    
    const netLines = new PIXI.Graphics();
    netLines.lineStyle(2, 0x00ffff, 0.8);
    
    for (let i = -50; i <= 50; i += 10) {
      netLines.moveTo(i, 0);
      netLines.lineTo(i * 0.6, 100);
    }
    
    for (let j = 20; j <= 100; j += 20) {
      const width = 100 * (j / 100) * 0.6;
      netLines.moveTo(-width, j);
      netLines.lineTo(width, j);
    }
    
    const rim = new PIXI.Graphics();
    rim.lineStyle(4, 0x00ffff);
    rim.drawEllipse(0, 0, 55, 15);
    
    const weights = new PIXI.Graphics();
    for (let i = -45; i <= 45; i += 15) {
      weights.beginFill(0xaaaaaa);
      weights.drawCircle(i, 0, 4);
      weights.endFill();
    }
    
    const ropeLeft = new PIXI.Graphics();
    ropeLeft.lineStyle(2, 0x888888);
    ropeLeft.moveTo(-50, 0);
    ropeLeft.lineTo(-80, -80);
    
    const ropeRight = new PIXI.Graphics();
    ropeRight.lineStyle(2, 0x888888);
    ropeRight.moveTo(50, 0);
    ropeRight.lineTo(80, -80);
    
    this.net.addChild(netLines);
    this.net.addChild(rim);
    this.net.addChild(weights);
    this.net.addChild(ropeLeft);
    this.net.addChild(ropeRight);
  }

  startNetAnimation(onComplete) {
    if (this.isNetActive) return;
    
    this.isNetActive = true;
    this.net.visible = true;
    this.net.x = this.app.screen.width * 0.5;
    this.net.y = this.app.screen.height * 0.45;
    this.net.scale.set(0.5);
    this.net.alpha = 0;
    
    const startY = this.app.screen.height * 0.45;
    const endY = this.app.screen.height * 0.75;
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 0.4) {
        const p = progress / 0.4;
        this.net.y = startY + (endY - startY) * p;
        this.net.scale.set(0.5 + 0.5 * p);
        this.net.alpha = p;
      } else if (progress < 0.6) {
        const p = (progress - 0.4) / 0.2;
        this.net.scale.set(1 + Math.sin(p * Math.PI * 4) * 0.05);
      } else {
        const p = (progress - 0.6) / 0.4;
        this.net.y = endY - (endY - startY) * p;
        this.net.scale.set(1 - 0.3 * p);
        this.net.alpha = 1 - p;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isNetActive = false;
        this.net.visible = false;
        if (onComplete) onComplete();
      }
    };
    
    animate();
  }

  update(delta) {
    this.time += delta;

    this.bgLayers.forEach(layer => {
      if (layer.isTiling) {
        layer.sprite.tilePosition.x -= layer.speed * delta;
      } else {
        layer.sprite.x -= layer.speed * delta;
        if (layer.sprite.x <= -layer.sprite.width / 2) {
          layer.sprite.x = 0;
        }
      }
    });

    this.floatingObjects.forEach(obj => {
      if (obj.type === 'wave') {
        obj.graphics.clear();
        obj.graphics.lineStyle(2, 0x00ffff, obj.graphics.alpha);

        for (let x = 0; x < this.app.screen.width; x += 5) {
          const y = Math.sin(x * obj.frequency + this.time * obj.speed + obj.offset) * obj.amplitude;
          if (x === 0) {
            obj.graphics.moveTo(x, y);
          } else {
            obj.graphics.lineTo(x, y);
          }
        }
      } else if (obj.type === 'debris') {
        obj.floatOffset += obj.floatSpeed * delta;
        obj.sprite.y = obj.baseY + Math.sin(obj.floatOffset) * obj.floatAmplitude;
        obj.sprite.x -= obj.horizontalSpeed * delta;

        if (obj.sprite.x < -20) {
          obj.sprite.x = this.app.screen.width + 20;
          obj.baseX = obj.sprite.x;
        }
      }
    });

    this.rainParticles.forEach(rain => {
      rain.sprite.y += rain.speed * delta;
      rain.sprite.x -= 2 * delta;

      if (rain.sprite.y > this.app.screen.height) {
        rain.sprite.y = -20;
        rain.sprite.x = Math.random() * this.app.screen.width;
      }
    });

    if (this.boat) {
      this.boat.y = this.app.screen.height * 0.42 + Math.sin(this.time * 0.05) * 3;
      this.boat.rotation = Math.sin(this.time * 0.03) * 0.02;
    }

    this.auroraParticles.forEach(a => {
      a.offset += a.speed * delta;
      a.graphics.clear();
      const r = (a.color >> 16) & 255;
      const g = (a.color >> 8) & 255;
      const b = a.color & 255;
      for (let x = 0; x < a.width; x += 10) {
        const y = Math.sin(x * 0.01 + a.offset) * a.amplitude;
        const nextY = Math.sin((x + 10) * 0.01 + a.offset) * a.amplitude;
        const gradient = a.graphics;
        gradient.lineStyle(8, PIXI.utils.rgb2hex([r / 255, g / 255, b / 255]), 0.4);
        gradient.moveTo(x, y);
        gradient.lineTo(x + 10, nextY);
      }
    });

    this.emergencyLights.forEach(l => {
      const pulse = Math.sin(this.time * l.speed + l.offset);
      l.graphics.alpha = (pulse * 0.5 + 0.5) * 0.6;
      l.graphics.x = l.baseX + Math.sin(this.time * l.speed * 0.5) * 20;
    });

    if (this.screenShake.intensity > 0) {
      this.container.x = (Math.random() - 0.5) * this.screenShake.intensity * 10;
      this.container.y = (Math.random() - 0.5) * this.screenShake.intensity * 10;
    } else {
      this.container.x = 0;
      this.container.y = 0;
    }

    this.eventParticles.forEach(p => {
      if (!p.sprite.visible) return;
      p.life -= delta;
      if (p.life <= 0) {
        p.sprite.visible = false;
        return;
      }
      p.sprite.x += p.vx * delta;
      p.sprite.y += p.vy * delta;
      p.vy += 0.05 * delta;
      p.sprite.alpha = p.life / p.maxLife;
      p.sprite.scale.set(0.5 + (p.life / p.maxLife) * 0.5);
    });

    if (this.currentNightEvent && Math.random() < 0.05) {
      this.spawnEventParticles(this.currentNightEvent.event.color, 2);
    }
  }

  resize(width, height) {
    const savedNightEvent = this.currentNightEvent;
    this.container.removeChildren();
    this.bgLayers = [];
    this.floatingObjects = [];
    this.rainParticles = [];
    this.auroraParticles = [];
    this.emergencyLights = [];
    this.eventParticles = [];

    this.createBackground();
    this.createRain();
    this.createFloatingObjects();
    this.createBoat();
    this.createNet();
    this.createTideOverlay();
    this.createNightEventOverlay();

    if (this.currentTide) {
      this.applyTideEffect(this.currentTide);
    }
    if (savedNightEvent) {
      this.applyNightVoyageEvent(savedNightEvent.event, savedNightEvent.branch);
    }
  }

  destroy() {
    this.app.ticker.remove(this.update.bind(this));
    this.container.destroy({ children: true });
  }
}

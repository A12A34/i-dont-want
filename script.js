// Application State
const state = {
    words: [],
    index: 0,
    speed: 300,
    paused: false,
    interval: null,
    selectedEffects: new Set(),
    trackIndex: 0,
    isPlaying: false,
    effectSettings: {} // Store settings for each effect
};

// Audio Playlist
const playlist = [
    'audio/music.mp3'
];

// Default effect settings
const defaultEffectSettings = {
    glitch: { duration: 0.15, intensity: 1.0 },
    shake: { duration: 0.35, intensity: 1.0 },
    bounce: { duration: 0.9, intensity: 1.0 },
    pulse: { duration: 0.95, intensity: 1.0 },
    wobble: { duration: 1.1, intensity: 1.0 },
    flicker: { duration: 1.3, intensity: 1.0 },
    blur: { duration: 1.4, intensity: 1.0 },
    zoom: { duration: 0.9, intensity: 1.0 },
    swing: { duration: 1.2, intensity: 1.0 },
    spin: { duration: 2.0, intensity: 1.0 },
    float: { duration: 2.0, intensity: 1.0 },
    wave: { duration: 1.5, intensity: 1.0 },
    rainbow: { duration: 3.0, intensity: 1.0 },
    neon: { duration: 1.5, intensity: 1.0 },
    elastic: { duration: 1.0, intensity: 1.0 },
    rotate3d: { duration: 2.0, intensity: 1.0 },
    gradient: { duration: 2.0, intensity: 1.0 }
};

// Conflict Groups - Effects that can't work together
const conflictGroups = [
    // Rotation effects conflict with each other
    ['spin', 'rotate3d', 'swing', 'wobble'],
    // Scale effects conflict with each other
    ['pulse', 'zoom', 'elastic'],
    // Position effects conflict with each other
    ['bounce', 'float', 'wave', 'shake', 'glitch'],
    // Filter effects conflict with each other
    ['rainbow', 'gradient'],
    // Text effects that conflict
    ['flicker', 'blur']
];

// Effect Categories
const transformEffects = new Set([
    'glitch', 'shake', 'bounce', 'pulse', 'wobble', 'zoom', 'swing',
    'spin', 'float', 'wave', 'elastic', 'rotate3d'
]);
const textOnlyEffects = new Set([
    'flicker', 'blur', 'rainbow', 'neon', 'gradient'
]);
const specialEffects = new Set(['slide']);

// Animation timing functions
const timingFunctions = {
    glitch: 'linear',
    shake: 'linear',
    bounce: 'ease-in-out',
    pulse: 'ease-in-out',
    wobble: 'ease-in-out',
    flicker: 'linear',
    blur: 'ease-in-out',
    zoom: 'ease-in-out',
    swing: 'ease-in-out',
    spin: 'linear',
    float: 'ease-in-out',
    wave: 'ease-in-out',
    rainbow: 'linear',
    neon: 'ease-in-out',
    elastic: 'ease-in-out',
    rotate3d: 'ease-in-out',
    gradient: 'ease-in-out'
};

// DOM Elements Cache
const elements = {
    wordInput: null,
    word: null,
    fxOuter: null,
    fxInner: null,
    setupPanel: null,
    controls: null,
    sidebarRight: null,
    speed: null,
    speedLabel: null,
    volume: null,
    volumeLabel: null,
    music: null,
    effects: null,
    effectControls: null
};

// Initialize effect settings
function initEffectSettings() {
    Object.keys(defaultEffectSettings).forEach(effect => {
        if (!state.effectSettings[effect]) {
            state.effectSettings[effect] = { ...defaultEffectSettings[effect] };
        }
    });
}

// Check if effects conflict
function hasConflict(effect1, effect2) {
    for (const group of conflictGroups) {
        if (group.includes(effect1) && group.includes(effect2) && effect1 !== effect2) {
            return true;
        }
    }
    return false;
}

// Get conflicting effects for a given effect
function getConflictingEffects(effect) {
    const conflicts = new Set();
    for (const group of conflictGroups) {
        if (group.includes(effect)) {
            group.forEach(e => {
                if (e !== effect) conflicts.add(e);
            });
        }
    }
    return conflicts;
}

// Initialize DOM elements
function initElements() {
    elements.wordInput = document.getElementById('wordInput');
    elements.word = document.getElementById('word');
    elements.fxOuter = document.getElementById('fxOuter');
    elements.fxInner = document.getElementById('fxInner');
    elements.setupPanel = document.getElementById('setupPanel');
    elements.controls = document.getElementById('controls');
    elements.sidebarRight = document.getElementById('sidebarRight');
    elements.speed = document.getElementById('speed');
    elements.speedLabel = document.getElementById('speedLabel');
    elements.volume = document.getElementById('volume');
    elements.volumeLabel = document.getElementById('volumeLabel');
    elements.music = document.getElementById('music');
    elements.effects = document.getElementById('effects');
    elements.effectControls = document.getElementById('effectControls');
}

// Initialize event listeners
function initEventListeners() {
    if (elements.wordInput) {
        elements.wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                start();
            }
        });
    }

    if (elements.speed) {
        elements.speed.addEventListener('input', updateSpeed);
    }

    if (elements.volume) {
        elements.volume.addEventListener('input', updateVolume);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Keyboard shortcuts
function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key) {
        case ' ': // Spacebar
            e.preventDefault();
            pause();
            break;
        case 'f':
        case 'F':
            fullscreen();
            break;
        case 'r':
        case 'R':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                reset();
            }
            break;
    }
}

// Generate animation string from settings
function getAnimationString(effect) {
    if (!state.effectSettings[effect]) return '';
    const settings = state.effectSettings[effect];
    const duration = settings.duration * (1 / settings.intensity); // Higher intensity = faster
    const timing = timingFunctions[effect] || 'ease-in-out';
    return `${effect} ${duration}s infinite ${timing}`;
}

// Update effect setting
function updateEffectSetting(effect, property, value) {
    if (!state.effectSettings[effect]) {
        state.effectSettings[effect] = { ...defaultEffectSettings[effect] };
    }
    state.effectSettings[effect][property] = parseFloat(value);
    applyEffects();
}

// Create effect controls UI
function createEffectControls(effect) {
    if (!state.effectSettings[effect]) {
        state.effectSettings[effect] = { ...defaultEffectSettings[effect] };
    }
    const settings = state.effectSettings[effect];
    
    const container = document.createElement('div');
    container.className = 'effect-control-panel';
    container.id = `control-${effect}`;
    container.dataset.effect = effect;
    
    const title = document.createElement('div');
    title.className = 'effect-control-title';
    title.textContent = effect.charAt(0).toUpperCase() + effect.slice(1);
    
    container.appendChild(title);
    
    // Duration control
    const durationContainer = document.createElement('div');
    durationContainer.className = 'effect-control-item';
    
    const durationLabel = document.createElement('div');
    durationLabel.className = 'control-label';
    durationLabel.innerHTML = `Duration: <span id="duration-${effect}">${settings.duration.toFixed(1)}s</span>`;
    
    const durationSlider = document.createElement('input');
    durationSlider.type = 'range';
    durationSlider.min = '0.1';
    durationSlider.max = '5';
    durationSlider.step = '0.1';
    durationSlider.value = settings.duration;
    durationSlider.id = `duration-slider-${effect}`;
    durationSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        updateEffectSetting(effect, 'duration', value);
        document.getElementById(`duration-${effect}`).textContent = value.toFixed(1) + 's';
    });
    
    durationContainer.appendChild(durationLabel);
    durationContainer.appendChild(durationSlider);
    container.appendChild(durationContainer);
    
    // Intensity control
    const intensityContainer = document.createElement('div');
    intensityContainer.className = 'effect-control-item';
    
    const intensityLabel = document.createElement('div');
    intensityLabel.className = 'control-label';
    intensityLabel.innerHTML = `Intensity: <span id="intensity-${effect}">${Math.round(settings.intensity * 100)}%</span>`;
    
    const intensitySlider = document.createElement('input');
    intensitySlider.type = 'range';
    intensitySlider.min = '0.1';
    intensitySlider.max = '2';
    intensitySlider.step = '0.1';
    intensitySlider.value = settings.intensity;
    intensitySlider.id = `intensity-slider-${effect}`;
    intensitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        updateEffectSetting(effect, 'intensity', value);
        document.getElementById(`intensity-${effect}`).textContent = Math.round(value * 100) + '%';
    });
    
    intensityContainer.appendChild(intensityLabel);
    intensityContainer.appendChild(intensitySlider);
    container.appendChild(intensityContainer);
    
    return container;
}

// Show/hide effect controls
function updateEffectControls() {
    if (!elements.effectControls) return;
    
    // Clear existing controls
    elements.effectControls.innerHTML = '';
    
    if (state.selectedEffects.size === 0) {
        elements.effectControls.style.display = 'none';
        return;
    }
    
    elements.effectControls.style.display = 'block';
    
    state.selectedEffects.forEach(effect => {
        const controlPanel = createEffectControls(effect);
        elements.effectControls.appendChild(controlPanel);
    });
}

// Start the application
function start() {
    const input = elements.wordInput?.value.trim();
    const phrase = (input || "i don't want to study").replace(/\s+/g, ' ').trim();
    state.words = phrase.split(' ');
    state.words.push(phrase);
    
    // Update UI
    elements.setupPanel?.classList.add('hidden');
    elements.controls?.classList.remove('hidden');
    elements.sidebarRight?.classList.remove('hidden');
    elements.word?.classList.remove('hidden');
    
    // Initialize settings
    state.speed = parseInt(elements.speed?.value || 300);
    if (elements.speedLabel) {
        elements.speedLabel.textContent = state.speed;
    }
    
    initEffectSettings();
    updateVolume();
    startMusic();
    run();
}

// Start music playback
function startMusic() {
    if (!elements.music || !playlist.length) return;
    
    state.trackIndex = 0;
    elements.music.src = playlist[state.trackIndex];
    elements.music.volume = parseFloat(elements.volume?.value || 60) / 100;
    
    elements.music.onended = () => {
        if (!playlist.length) return;
        state.trackIndex = (state.trackIndex + 1) % playlist.length;
        elements.music.src = playlist[state.trackIndex];
        elements.music.play().catch(err => {
            console.warn('Audio playback error:', err);
        });
    };
    
    elements.music.play().then(() => {
        state.isPlaying = true;
    }).catch(err => {
        console.warn('Audio playback error:', err);
        state.isPlaying = false;
    });
}

// Main animation loop
function run() {
    clearInterval(state.interval);
    state.interval = setInterval(() => {
        if (state.paused) return;
        
        updateDisplay();
        state.index++;
    }, state.speed);
}

// Update the display
function updateDisplay() {
    const bg = randomColor();
    document.body.style.background = gradient(bg);
    
    const text = invert(bg);
    if (elements.word) {
        elements.word.textContent = state.words[state.index % state.words.length];
        elements.word.style.color = text;
        applyEffects();
    }
}

// Update speed
function updateSpeed() {
    state.speed = parseInt(elements.speed?.value || 300);
    if (elements.speedLabel) {
        elements.speedLabel.textContent = state.speed;
    }
    run();
}

// Update volume
function updateVolume() {
    if (!elements.music || !elements.volume) return;
    
    const vol = parseInt(elements.volume.value);
    elements.music.volume = Math.max(0, Math.min(1, vol / 100));
    
    if (elements.volumeLabel) {
        elements.volumeLabel.textContent = vol;
    }
}

// Pause/Resume
function pause() {
    state.paused = !state.paused;
    if (elements.music) {
        if (state.paused) {
            elements.music.pause();
        } else {
            elements.music.play().catch(err => {
                console.warn('Audio playback error:', err);
            });
        }
    }
}

// Reset application
function reset() {
    location.reload();
}

// Fullscreen
function fullscreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn('Fullscreen error:', err);
        });
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    }
}

// Color utilities
function randomColor() {
    return `rgb(${r()}, ${r()}, ${r()})`;
}

function invert(rgb) {
    const numbers = rgb.match(/\d+/g)?.map(Number) || [0, 0, 0];
    return `rgb(${255 - numbers[0]}, ${255 - numbers[1]}, ${255 - numbers[2]})`;
}

function gradient(rgb) {
    const variations = [
        `radial-gradient(circle, ${rgb}, black)`,
        `linear-gradient(135deg, ${rgb}, black)`,
        `linear-gradient(45deg, ${rgb}, black)`,
        `radial-gradient(ellipse, ${rgb}, black)`
    ];
    return variations[Math.floor(Math.random() * variations.length)];
}

function r() {
    return Math.floor(Math.random() * 256);
}

// Effect management
function toggleEffect(effect) {
    // Check for conflicts with currently selected effects
    const conflicts = getConflictingEffects(effect);
    
    if (state.selectedEffects.has(effect)) {
        // Remove the effect
        state.selectedEffects.delete(effect);
    } else {
        // Remove conflicting effects first
        conflicts.forEach(conflictEffect => {
            state.selectedEffects.delete(conflictEffect);
        });
        // Add the new effect
        state.selectedEffects.add(effect);
    }
    
    applyEffects();
    updateEffectControls();
}

function clearEffects() {
    state.selectedEffects.clear();
    applyEffects();
    updateEffectControls();
}

// Apply effects to elements
function applyEffects() {
    if (!elements.word || !elements.fxOuter || !elements.fxInner) return;
    
    const transformList = [];
    const textList = [];
    const specialList = [];
    
    state.selectedEffects.forEach(effect => {
        if (transformEffects.has(effect)) {
            transformList.push(effect);
        } else if (textOnlyEffects.has(effect)) {
            textList.push(effect);
        } else if (specialEffects.has(effect)) {
            specialList.push(effect);
        }
    });
    
    const outerAnim = [];
    const innerAnim = [];
    const textAnim = [];
    
    // Apply up to 2 transform effects across nested wrappers
    if (transformList[0]) {
        const anim = getAnimationString(transformList[0]);
        if (anim) outerAnim.push(anim);
    }
    if (transformList[1]) {
        const anim = getAnimationString(transformList[1]);
        if (anim) innerAnim.push(anim);
    }
    
    // Apply text-only effects
    textList.forEach(effect => {
        const anim = getAnimationString(effect);
        if (anim) textAnim.push(anim);
    });
    
    // Apply special effects
    specialList.forEach(effect => {
        const anim = getAnimationString(effect);
        if (anim) {
            outerAnim.push(anim);
        }
    });
    
    elements.fxOuter.style.animation = outerAnim.length ? outerAnim.join(', ') : 'none';
    elements.fxInner.style.animation = innerAnim.length ? innerAnim.join(', ') : 'none';
    elements.word.style.animation = textAnim.length ? textAnim.join(', ') : 'none';
    
    // Update button states
    updateEffectButtons();
}

// Update effect button active states
function updateEffectButtons() {
    const buttons = document.querySelectorAll('#effects .effectBtn');
    buttons.forEach(button => {
        const effect = button.dataset.effect;
        if (effect === 'none') {
            button.classList.toggle('active', state.selectedEffects.size === 0);
        } else {
            button.classList.toggle('active', state.selectedEffects.has(effect));
            // Disable buttons for conflicting effects
            const conflicts = getConflictingEffects(effect);
            const hasActiveConflict = Array.from(state.selectedEffects).some(selected => conflicts.has(selected));
            button.classList.toggle('disabled', hasActiveConflict && !state.selectedEffects.has(effect));
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    initEffectSettings();
});

// Export functions for inline event handlers (if needed)
window.start = start;
window.pause = pause;
window.reset = reset;
window.fullscreen = fullscreen;
window.updateSpeed = updateSpeed;
window.updateVolume = updateVolume;
window.toggleEffect = toggleEffect;
window.clearEffects = clearEffects;

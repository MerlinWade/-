// ================================================================
// Effects.js - 独立恐怖特效库
// 功能：红色闪烁、警告音、黑屏乱码、红色提示框、红色"再见"文字雨等
// 依赖：无外部依赖，自动注入所需 CSS 样式
// 使用：Effects.redFlash(), Effects.playWarningSound(), etc.
// ================================================================

(function() {
    'use strict';

    // ---------- 自动注入特效所需的样式（独立于主题） ----------
    function injectEffectStyles() {
        if (document.getElementById('effects-styles')) return;
        const style = document.createElement('style');
        style.id = 'effects-styles';
        style.textContent = `
            /* 红色提示框 */
            .custom-toast {
                position: fixed;
                top: 40%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #c00000;
                color: white;
                padding: 16px 28px;
                border-radius: 12px;
                font-weight: bold;
                font-size: 1.2rem;
                box-shadow: 0 0 20px rgba(255,0,0,0.6);
                z-index: 20000;
                text-align: center;
                white-space: nowrap;
                pointer-events: none;
            }
            /* 黑屏遮罩 */
            .blackout {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: black;
                z-index: 30000;
                opacity: 0;
                transition: opacity 0.2s;
                pointer-events: none;
            }
            .blackout.active {
                opacity: 1;
                pointer-events: auto;
            }
            @media (max-width: 550px) {
                .custom-toast {
                    font-size: 1rem;
                    padding: 12px 20px;
                    white-space: normal;
                    width: 80%;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ---------- 音频上下文（单例，避免重复创建） ----------
    let audioCtx = null;

    // ---------- 特效函数 ----------
    function playWarningSound() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const currentTime = audioCtx.currentTime;
            // 声音1: 低音
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.type = 'sawtooth';
            osc1.frequency.value = 440;
            gain1.gain.value = 0;
            osc1.start();
            gain1.gain.linearRampToValueAtTime(0.3, currentTime + 0.02);
            gain1.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.2);
            osc1.stop(currentTime + 0.2);
            // 声音2: 高音
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.type = 'square';
            osc2.frequency.value = 880;
            gain2.gain.value = 0;
            osc2.start(currentTime + 0.1);
            gain2.gain.linearRampToValueAtTime(0.25, currentTime + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.6);
            osc2.stop(currentTime + 0.6);
            // 白噪音
            const bufferSize = 4096;
            const noiseNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
            noiseNode.onaudioprocess = function(e) {
                const output = e.outputBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = (Math.random() * 2 - 1) * 0.8;
                }
            };
            const noiseGain = audioCtx.createGain();
            noiseNode.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            noiseGain.gain.value = 0;
            noiseGain.gain.linearRampToValueAtTime(0.15, currentTime + 0.05);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.4);
            noiseNode.start(currentTime);
            noiseNode.stop(currentTime + 0.4);
            setTimeout(() => {
                try { noiseNode.disconnect(); } catch(e) {}
            }, 500);
        } catch(e) {
            console.warn('警告音效播放失败', e);
        }
    }

    function redFlash() {
        const flashOverlay = document.createElement('div');
        flashOverlay.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(255, 0, 0, 0.8);
            z-index: 99999;
            pointer-events: none;
            transition: opacity 0.2s;
            opacity: 1;
        `;
        document.body.appendChild(flashOverlay);
        setTimeout(() => {
            flashOverlay.style.opacity = '0';
            setTimeout(() => {
                flashOverlay.remove();
            }, 200);
        }, 300);
    }

    function showWarning(message, duration = 3000) {
        injectEffectStyles();
        const toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, duration);
    }

    function blackout(durationMs = 1500) {
        injectEffectStyles();
        let blackDiv = document.querySelector('.blackout');
        if (!blackDiv) {
            blackDiv = document.createElement('div');
            blackDiv.className = 'blackout';
            document.body.appendChild(blackDiv);
        }
        const toast = document.querySelector('.custom-toast');
        if (toast) toast.style.zIndex = '30001';
        blackDiv.classList.add('active');
        setTimeout(() => {
            blackDiv.classList.remove('active');
            const bodyElement = document.body;
            bodyElement.style.transition = 'all 0.1s';
            bodyElement.style.filter = 'blur(2px)';
            let counter = 0;
            const interval = setInterval(() => {
                if (counter >= 3) {
                    clearInterval(interval);
                    bodyElement.style.filter = '';
                    bodyElement.style.transition = '';
                    if (toast && toast.parentNode) toast.remove();
                    return;
                }
                if (counter % 2 === 0) {
                    bodyElement.style.filter = 'blur(3px) grayscale(1)';
                    bodyElement.style.opacity = '0.95';
                } else {
                    bodyElement.style.filter = '';
                    bodyElement.style.opacity = '';
                }
                counter++;
            }, 150);
        }, durationMs);
    }

    function showRedGoodbye(callback) {
        injectEffectStyles();
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 40000; pointer-events: none;
            overflow: hidden;
        `;
        document.body.appendChild(container);
        const wordCount = 200;
        const words = [];
        for (let i = 0; i < wordCount; i++) {
            const span = document.createElement('span');
            span.textContent = '再见';
            span.style.cssText = `
                position: absolute; color: #ff0000;
                font-size: ${Math.floor(Math.random() * 80 + 20)}px;
                font-weight: bold; font-family: monospace;
                white-space: nowrap; opacity: 0;
                transition: opacity 0.05s linear;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                transform: rotate(${Math.random() * 30 - 15}deg);
            `;
            container.appendChild(span);
            words.push(span);
        }
        const delays = words.map(() => Math.random() * 1000);
        let completedCount = 0;
        const soundInterval = 25;
        words.forEach((word, idx) => {
            setTimeout(() => {
                word.style.opacity = '1';
                if (idx % soundInterval === 0) playWarningSound();
                completedCount++;
                if (completedCount === wordCount) redFlash();
            }, delays[idx]);
        });
        setTimeout(() => {
            words.forEach(word => {
                word.style.transition = 'opacity 0.3s';
                word.style.opacity = '0';
            });
            setTimeout(() => {
                container.remove();
                if (typeof callback === 'function') callback();
            }, 400);
        }, 1200);
    }

    // ---------- 暴露公共API ----------
    window.Effects = {
        playWarningSound,
        redFlash,
        showWarning,
        blackout,
        showRedGoodbye
    };

    // 自动注入样式（提前准备好，但不影响后续使用）
    injectEffectStyles();

})();

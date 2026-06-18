// ================================================================
// NingyuanTheme.js - 宁源主题管理
// 依赖：Effects.js（特效库）, Log&Register.js（事件）
// 功能：应用/移除宁源主题，监听认证事件自动切换
// 使用：页面只需引入此文件，自动运行
// ================================================================

(function() {
    'use strict';

    // ---------- 动态元素灰度工具 ----------
    function applyGrayScaleIfNeeded(element) {
        if (document.body.classList.contains('ningyuan-mode') && element) {
            element.classList.add('ningyuan-grayscale');
        }
    }

    // ---------- 卡片内容替换与恢复 ----------
    function applyCardContent() {
        const cardLink = document.getElementById('card-link-wrapper');
        const cardImg = document.getElementById('card-img');
        const cardTextOverlay = document.querySelector('.card-text-overlay');
        if (cardLink && cardImg && cardTextOverlay) {
            // 保存原始内容（仅首次）
            if (!cardLink.hasAttribute('data-original-href')) {
                cardLink.setAttribute('data-original-href', cardLink.href);
                cardImg.setAttribute('data-original-src', cardImg.src);
                const originalTitle = cardTextOverlay.querySelector('.card-title')?.innerText || '';
                const originalDesc = cardTextOverlay.querySelector('.card-desc')?.innerText || '';
                cardLink.setAttribute('data-original-title', originalTitle);
                cardLink.setAttribute('data-original-desc', originalDesc);
            }
            // 替换为宁源内容
            cardImg.src = 'images/20180417.jpg';
            cardTextOverlay.innerHTML = `
                <div class="card-title">逝者已去</div>
                <div class="card-desc">记者了解到，这背后隐藏着另一个秘密……</div>
            `;
            cardLink.href = 'special.html';
            cardLink.onclick = function(e) {
                // 可自定义跳转行为
                // alert('进入宁源专属页面');
                return true;
            };
        }
    }

    function restoreCardContent() {
        const cardLink = document.getElementById('card-link-wrapper');
        const cardImg = document.getElementById('card-img');
        const cardTextOverlay = document.querySelector('.card-text-overlay');
        if (cardLink && cardImg && cardTextOverlay) {
            const originalHref = cardLink.getAttribute('data-original-href');
            const originalSrc = cardImg.getAttribute('data-original-src');
            const originalTitle = cardLink.getAttribute('data-original-title');
            const originalDesc = cardLink.getAttribute('data-original-desc');
            if (originalHref) cardLink.href = originalHref;
            if (originalSrc) cardImg.src = originalSrc;
            if (originalTitle && originalDesc) {
                cardTextOverlay.innerHTML = `
                    <div class="card-title">${originalTitle}</div>
                    <div class="card-desc">${originalDesc}</div>
                `;
            }
            cardLink.onclick = null;
        }
    }

    // ---------- 主题应用 ----------
    function applyNingyuanTheme() {
        // 添加 body 类（触发 CSS 中的灰色背景、挽联等）
        document.body.classList.add('ningyuan-mode');

        // 对主要内容区域添加灰度类
        const grayscaleTargets = document.querySelectorAll(
            '.navbar, .container, .virtual-footer-section, .real-footer, .external-push-wrapper'
        );
        grayscaleTargets.forEach(el => el.classList.add('ningyuan-grayscale'));

        // 处理已存在的动态元素（下拉菜单、预览浮层）
        const dropdown = document.getElementById('global-user-dropdown');
        if (dropdown) dropdown.classList.add('ningyuan-grayscale');
        const previewOverlay = document.querySelector('.img-preview-overlay');
        if (previewOverlay) previewOverlay.classList.add('ningyuan-grayscale');

        // 天气栏变红
        const weatherDiv = document.querySelector('.weather-info');
        if (weatherDiv) {
            weatherDiv.textContent = '📍 ？？？ -8层';
            weatherDiv.style.color = '#ff0000';
        }

        // 处理卡片内容
        applyCardContent();
    }

    // ---------- 主题恢复 ----------
    function restoreDefaultTheme() {
        document.body.classList.remove('ningyuan-mode');

        const grayscaleTargets = document.querySelectorAll(
            '.navbar, .container, .virtual-footer-section, .real-footer, .external-push-wrapper'
        );
        grayscaleTargets.forEach(el => el.classList.remove('ningyuan-grayscale'));

        // 移除动态元素的灰度类
        const dropdown = document.getElementById('global-user-dropdown');
        if (dropdown) dropdown.classList.remove('ningyuan-grayscale');
        const previewOverlay = document.querySelector('.img-preview-overlay');
        if (previewOverlay) previewOverlay.classList.remove('ningyuan-grayscale');

        const weatherDiv = document.querySelector('.weather-info');
        if (weatherDiv) {
            weatherDiv.textContent = '📍 北淀市 -18℃ 雨';
            weatherDiv.style.color = '';
            weatherDiv.style.backgroundColor = '';
        }
        // 注意：恢复默认主题时，不恢复卡片内容（卡片内容由单独调用 restoreCardContent 恢复）
    }

    // ---------- 事件监听（与 Log&Register.js 联动） ----------
    window.addEventListener('auth:NingYuan-register', function() {
        if (window.Effects) {
            window.Effects.playWarningSound();
            window.Effects.showWarning('⚠️ 该用户名已被占用 ⚠️', 1800);
            window.Effects.blackout(2000);
        } else {
            console.warn('Effects.js 未加载，无法播放注册特效');
        }
    });

    window.addEventListener('auth:NingYuan-login', function() {
        applyNingyuanTheme();
        if (window.Effects && typeof window.Effects.redFlash === 'function') {
            window.Effects.redFlash();
        } else {
            console.warn('Effects.js 未加载，无法播放红色闪烁');
        }
    });

    window.addEventListener('auth:login', function() {
        // 普通用户登录，恢复默认主题（但不恢复卡片？这里应该全部恢复，因为普通用户登录时宁源已经退出）
        // 实际上，普通用户登录不应该有宁源残留，所以恢复主题并恢复卡片
        restoreDefaultTheme();
        restoreCardContent();  // 普通登录也要恢复卡片
    });

    window.addEventListener('auth:logout', function() {
        // 普通登出：立即恢复样式和卡片
        restoreDefaultTheme();
        restoreCardContent();
    });

    window.addEventListener('auth:NingYuan-logout', function() {
        if (window.Effects) {
            window.Effects.playWarningSound();
            window.Effects.showWarning('没关系，下次再见~', 1800);

            setTimeout(() => {
                restoreDefaultTheme();   // 1.8秒后恢复样式，但不恢复卡片
            }, 1800);

            setTimeout(() => {
                window.Effects.showRedGoodbye(() => {
                    // 特效结束后恢复卡片内容并登出
                    restoreCardContent();
                    if (window.Auth && typeof window.Auth.logout === 'function') {
                        window.Auth.logout();
                    }
                });
            }, 2200);
        }
    });

    // ---------- 页面加载时检查初始状态 ----------
    function checkInitialState() {
        if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
            const user = window.Auth.getCurrentUser();
            if (user === '宁源') {
                applyNingyuanTheme();
            } else {
                restoreDefaultTheme();
                restoreCardContent(); // 确保初始状态卡片正确
            }
        } else {
            setTimeout(checkInitialState, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkInitialState);
    } else {
        setTimeout(checkInitialState, 50);
    }

    // ---------- 暴露公共接口 ----------
    window.NingyuanTheme = {
        apply: applyNingyuanTheme,
        restore: restoreDefaultTheme,
        applyGrayScaleIfNeeded: applyGrayScaleIfNeeded
    };

})();

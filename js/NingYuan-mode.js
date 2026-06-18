// ================================================================
// NingyuanTheme.js - 宁源主题管理
// 依赖：Effects.js（特效库）, Log&Register.js（事件）
// 功能：应用/移除宁源主题，监听认证事件自动切换
// 使用：页面只需引入此文件，自动运行
// ================================================================

(function() {
    'use strict';

    // ---------- 主题应用 ----------
    function applyNingyuanTheme() {
        // 添加 body 类（触发 CSS 中的灰色背景、挽联等）
        document.body.classList.add('ningyuan-mode');

        // 对主要内容区域添加灰度类（根据实际页面结构调整选择器）
        const grayscaleTargets = document.querySelectorAll(
            '.navbar, .container, .virtual-footer-section, .real-footer, .external-push-wrapper'
        );
        grayscaleTargets.forEach(el => el.classList.add('ningyuan-grayscale'));

        // ---------- 动态元素灰度工具 ----------
    function applyGrayScaleIfNeeded(element) {
        if (document.body.classList.contains('ningyuan-mode') && element) {
            element.classList.add('ningyuan-grayscale');
        }
    }
        
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
        // 其他宁源专属内容替换可由页面自行处理（如卡片替换），此处不强制
        // 若需要通用替换，可在此扩展，但建议保持模块精简
    }
    
       
    // ---------- 主题恢复 ----------
    function restoreDefaultTheme() {
        document.body.classList.remove('ningyuan-mode');

        const grayscaleTargets = document.querySelectorAll(
            '.navbar, .container, .virtual-footer-section, .real-footer, .external-push-wrapper'
        );
        grayscaleTargets.forEach(el => el.classList.remove('ningyuan-grayscale'));

        const weatherDiv = document.querySelector('.weather-info');
        if (weatherDiv) {
            weatherDiv.textContent = '📍 北淀市 -18℃ 雨';
            weatherDiv.style.color = '';
            weatherDiv.style.backgroundColor = '';
        }
    }
        // 恢复卡片内容
        restoreCardContent();

        // 移除动态元素的灰度类
        const dropdown = document.getElementById('global-user-dropdown');
        if (dropdown) dropdown.classList.remove('ningyuan-grayscale');
        const previewOverlay = document.querySelector('.img-preview-overlay');
        if (previewOverlay) previewOverlay.classList.remove('ningyuan-grayscale');
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
        // 调用特效：红色闪烁（宁源登录专属）
        if (window.Effects && typeof window.Effects.redFlash === 'function') {
            window.Effects.redFlash();
        } else {
            console.warn('Effects.js 未加载，无法播放红色闪烁');
        }
    });

    window.addEventListener('auth:login', function() {
        // 普通用户登录，确保恢复默认主题（如果之前是宁源模式）
        restoreDefaultTheme();
    });

    window.addEventListener('auth:logout', function() {
        restoreDefaultTheme();
    });

    window.addEventListener('auth:NingYuan-logout', function() {        
                    playWarningSound();
                    showWarning('没关系，下次再见~', 1800);   // 红色警告框，持续1.8秒
                    
                    // 第一步：在警告框消失的同时（1.8秒后）恢复彩色界面
                    setTimeout(() => {
                        restoreDefaultTheme();   // 移除灰度滤镜、恢复天气栏、移除挽联
                    }, 1800);
                    
                    // 第二步：再延迟0.4秒（即总延迟2.2秒）开始显示红色“再见”特效
                    setTimeout(() => {
                        showRedGoodbye(() => {
                        });
                    }, 2200);
                    return; 
    });

    // ---------- 页面加载时检查初始状态 ----------
    function checkInitialState() {
        if (window.Auth && typeof window.Auth.getCurrentUser === 'function') {
            const user = window.Auth.getCurrentUser();
            if (user === '宁源') {
                applyNingyuanTheme();
                // 注意：登录时的红色闪烁已在 auth:NingYuan-login 事件中触发，
                // 此处不重复调用，避免刷新页面时误触。
            } else {
                restoreDefaultTheme();
            }
        } else {
            // Auth 未加载，延迟重试
            setTimeout(checkInitialState, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkInitialState);
    } else {
        // DOM 已加载，稍后执行等待 Auth 初始化
        setTimeout(checkInitialState, 50);
    }

    // ---------- 暴露公共接口（供外部手动调用） ----------
    window.NingyuanTheme = {
        apply: applyNingyuanTheme,
        restore: restoreDefaultTheme
        applyGrayScaleIfNeeded: applyGrayScaleIfNeeded   // 供动态元素创建时调用
    };

})();

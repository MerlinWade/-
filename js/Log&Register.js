// ================================================================
// 模块：Log&Register.js
// 功能：单用户认证（临时账号 + 宁源特殊账号）
// 依赖：localStorage，无其他外部依赖
// 使用方式：页面引入后，通过 Auth 对象调用 API
// ================================================================

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        ADMIN_USERNAME: '宁源',
        ADMIN_PASSWORD: '20180417',
        STORAGE_KEY: 'arg_single_user',
        INVITE_CODE: 'womenjiehunba'   // 注册内推码
    };

    // ==================== 状态 ====================
    let currentUser = null;  // 存储当前登录用户名

    // ==================== 存储操作 ====================
    function getStoredUser() {
        const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (raw) {
            try { return JSON.parse(raw); } catch(e) { return null; }
        }
        return null;
    }

    function saveUser(username, password) {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ username, password }));
    }

    function clearUser() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }

    // ==================== 核心认证 API ====================
    function login(username, password) {
        if (!username || !password) {
            return { success: false, message: '用户名和密码不能为空' };
        }
        // 1. 检查是否为宁源
        if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
            currentUser = CONFIG.ADMIN_USERNAME;
            // 注意：宁源账号不存入 localStorage，仅作为内置账号
            window.dispatchEvent(new CustomEvent('auth:NingYuan-login'));
            updateNavButtons();
            return { success: true, user: currentUser, message: `账号「${currentUser}」登录成功` };
        }
        // 2. 检查普通用户
        const stored = getStoredUser();
        if (stored && stored.username === username && stored.password === password) {
            currentUser = username;
            window.dispatchEvent(new CustomEvent('auth:login'));
            updateNavButtons();
            return { success: true, user: currentUser, message: `账号「${currentUser}」登录成功` };
        }
        return { success: false, message: '用户名或密码错误' };
    }

    function register(username, password, confirmPwd, inviteCode) {
        // 校验输入
        if (!username) return { success: false, message: '用户名不能为空' };
        if (!password) return { success: false, message: '密码不能为空' };
        if (!confirmPwd) return { success: false, message: '请确认密码' };
        if (!inviteCode) return { success: false, message: '内推码不能为空' };
        if (password !== confirmPwd) return { success: false, message: '两次输入的密码不一致' };
        if (inviteCode !== CONFIG.INVITE_CODE) return { success: false, message: '内推码错误' };
        // 检查用户名是否被占用（不包括宁源）
        if (username === CONFIG.ADMIN_USERNAME) {
          window.dispatchEvent(new CustomEvent('auth:NingYuan-register'));
          return { success: false, silent: true };
        }
        const existing = getStoredUser();
        if (existing && existing.username === username) {
            return { success: false, message: '用户名已被注册' };
        }
        // 保存
        saveUser(username, password);
        return { success: true, message: `临时账号「${username}」注册成功` };
    }

    function logout() {
        const username = currentUser;  // 先保存
        currentUser = null;
        // 不清理 localStorage，仅清空会话状态
      window.dispatchEvent(new CustomEvent('auth:logout'));
        updateNavButtons();
      return { success: true, message: `账号「${username}」已登出` };
    }

    function deleteAccount() {
        const isAdmin = (currentUser === CONFIG.ADMIN_USERNAME);
        if (isAdmin) {
            // 宁源账号不能删除，仅清空会话
            currentUser = null;
            window.dispatchEvent(new CustomEvent('auth:NingYuan-logout'));
            updateNavButtons();
            return { success: true,  silent: true };
        }
        const stored = getStoredUser();
        if (stored && stored.username === currentUser) {
            const username = currentUser;
            clearUser();
            currentUser = null;
          window.dispatchEvent(new CustomEvent('auth:logout'));
            updateNavButtons();
          return { success: true, message: `临时账号「${username}」已注销\n感谢您的使用！` };
        }
        return { success: false, message: '未找到要注销的账号' };
    }

    // ==================== 状态查询 ====================
    function getCurrentUser() {
        return currentUser || null;
    }

    function isAdminUser() {
        return currentUser === CONFIG.ADMIN_USERNAME;
    }

    // ==================== 模态框（内嵌 HTML + 样式，开箱即用） ====================
    // 注意：模态框样式会动态注入，不影响页面已有样式
    function injectModalStyles() {
        if (document.getElementById('auth-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'auth-modal-styles';
        style.textContent = `
            .auth-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                visibility: hidden;
                opacity: 0;
                transition: 0.2s;
            }
            .auth-modal-overlay.active {
                visibility: visible;
                opacity: 1;
            }
            .auth-modal {
                background: #e6f0ff;
                width: 90%;
                max-width: 420px;
                border-radius: 28px;
                padding: 24px 22px 32px;
                box-shadow: 0 20px 35px rgba(0,0,0,0.3);
                transform: scale(0.96);
                transition: transform 0.2s;
                border: 1px solid #b8d4ff;
                position: relative;
            }
            .auth-modal.active {
                transform: scale(1);
            }
            .auth-modal h3 {
                font-size: 1.7rem;
                margin: 0 0 12px 0;
                color: #1f6390;
                border-bottom: 2px solid #c0e0ff;
                padding-bottom: 10px;
            }
            .auth-close {
                position: absolute;
                top: 12px;
                right: 18px;
                font-size: 28px;
                cursor: pointer;
                color: #5a8bb9;
            }
            .auth-close:hover { color: #1f6390; }
            .auth-group {
                margin-bottom: 18px;
            }
            .auth-group label {
                display: block;
                font-weight: 600;
                margin-bottom: 6px;
                color: #1e4b6e;
            }
            .auth-group input {
                width: 100%;
                padding: 10px 14px;
                border: 1.5px solid #c0d9f0;
                border-radius: 40px;
                font-size: 1rem;
                outline: none;
                background: white;
            }
            .auth-group input:focus {
                border-color: #3c8dc5;
                box-shadow: 0 0 0 3px rgba(60,141,197,0.2);
            }
            .auth-buttons {
                display: flex;
                gap: 12px;
                margin-top: 24px;
            }
            .auth-buttons button {
                flex: 1;
                padding: 10px;
                border-radius: 40px;
                font-weight: bold;
                border: none;
                cursor: pointer;
                font-size: 1rem;
            }
            .auth-btn-primary {
                background: linear-gradient(135deg, #3c8dc5, #2c6f9e);
                color: white;
            }
            .auth-btn-secondary {
                background: #d9eaff;
                color: #1e4b6e;
                border: 1px solid #b0cce8;
            }
            .forgot-link {
                text-align: right;
                margin: -8px 0 12px;
            }
            .forgot-link a {
                font-size: 0.8rem;
                color: #2c7da0;
                text-decoration: none;
                cursor: pointer;
            }
            @media (max-width: 550px) {
                .auth-modal { padding: 18px; }
                .auth-modal h3 { font-size: 1.4rem; }
            }
        `;
        document.head.appendChild(style);
    }

    let currentModal = null;

    function createModal(modalType) {
        // 关闭已有模态框
        if (currentModal) {
            currentModal.classList.remove('active');
            setTimeout(() => {
                if (currentModal && currentModal.parentNode) currentModal.remove();
                currentModal = null;
            }, 200);
        }

        injectModalStyles();

        const overlay = document.createElement('div');
        overlay.className = 'auth-modal-overlay';
        const isRegister = (modalType === 'register');
        const title = isRegister ? '注册临时账号' : '登录';
        const submitText = isRegister ? '注册' : '登陆';

        let html = `
            <div class="auth-modal">
                <span class="auth-close">&times;</span>
                <h3>${title}</h3>
                <div class="auth-group">
                    <label>用户名</label>
                    <input type="text" id="auth_username" placeholder="${isRegister ? '请输入用户名' : '你的注册名'}">
                </div>
                <div class="auth-group">
                    <label>密码</label>
                    <input type="password" id="auth_password" placeholder="${isRegister ? '设置密码' : '密码'}">
                </div>
        `;

        if (isRegister) {
            html += `
                <div class="auth-group">
                    <label>确认密码</label>
                    <input type="password" id="auth_confirm" placeholder="再次输入密码">
                </div>
                <div class="auth-group">
                    <label>内推码</label>
                    <input type="text" id="auth_invite" placeholder="请输入内推码">
                </div>
            `;
        } else {
            html += `
                <div class="forgot-link"><a id="auth_forgot">忘记密码？</a></div>
            `;
        }

        html += `
                <div class="auth-buttons">
                    <button class="auth-btn-primary" id="auth_submit">${submitText}</button>
                    <button class="auth-btn-secondary" id="auth_cancel">取消</button>
                </div>
            </div>
        `;

        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        currentModal = overlay;

        // ---- 事件绑定 ----
        const closeBtn = overlay.querySelector('.auth-close');
        const cancelBtn = overlay.querySelector('#auth_cancel');
        const submitBtn = overlay.querySelector('#auth_submit');

        function closeModal() {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
                if (currentModal === overlay) currentModal = null;
            }, 200);
        }

        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

        // 提交处理
        submitBtn.onclick = function() {
            const username = document.getElementById('auth_username').value.trim();
            const password = document.getElementById('auth_password').value;
            let result;

            if (isRegister) {
                const confirm = document.getElementById('auth_confirm').value;
                const invite = document.getElementById('auth_invite').value.trim();
                result = register(username, password, confirm, invite);
                if (result.success) {
                    alert('✨ 注册成功！\n欢迎「' + username + '」，请登录。');
                    closeModal();
                 } else if (result.silent) {
                  // 静默失败（宁源注册触发特效），不显示 alert，保留模态框清空输入内容方便用户更改（仅作彩蛋）
                     overlay.querySelector('#auth_username').value = '';
                     overlay.querySelector('#auth_password').value = '';
                     overlay.querySelector('#auth_confirm').value = '';
                     overlay.querySelector('#auth_invite').value = '';
                  return
                } else {
                    alert('❌ ' + result.message);
                }
            } else {
                // 登录
                result = login(username, password);
                if (result.success) {
                    alert('✅ 登陆成功！欢迎回来，' + result.user);
                    closeModal();
                    // 触发外部更新（例如刷新按钮状态）
                    if (typeof window.onAuthStateChanged === 'function') {
                        window.onAuthStateChanged(result.user);
                    }
                } else {
                    alert('❌ ' + result.message);
                }
            }
        };

        // 忘记密码（仅登录模态框）
        const forgotLink = overlay.querySelector('#auth_forgot');
        if (forgotLink) {
            forgotLink.onclick = function(e) {
                e.preventDefault();
                const stored = getStoredUser();
                if (!stored) {
                    alert('❌ 本机尚无注册账号信息，请先注册临时账号。');
                    return;
                }
                const code = prompt('🔐 密码找回验证\n请输入内推码：');
                if (code === null) return;
                if (code === CONFIG.INVITE_CODE) {
                    alert(`当前临时账号「${stored.username}」的密码是：${stored.password}\n请妥善保管。`);
                } else {
                    alert('❌ 内推码错误，无法获取密码。');
                }
            };
        }

        // 显示模态框
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    }
    // ==================== 登陆后的下拉菜单 ====================
function updateNavButtons() {
    const navRight = document.querySelector('.navbar-right');
    if (!navRight) return;
    
    if (currentUser) {
        // 显示用户名按钮
        navRight.innerHTML = `<button class="user-menu-btn" style="padding: 7px 16px; background: #0066cc; color: white; border: none; border-radius: 3px; cursor: pointer;">👤 ${currentUser}</button>`;
        const menuBtn = navRight.querySelector('.user-menu-btn');
        
        // 移除已存在的下拉菜单
        const oldDropdown = document.getElementById('global-user-dropdown');
        if (oldDropdown) oldDropdown.remove();
        
        // 创建下拉菜单
        const dropdown = document.createElement('div');
        dropdown.id = 'global-user-dropdown';
        dropdown.style.position = 'fixed';
        dropdown.style.backgroundColor = 'white';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.borderRadius = '4px';
        dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        dropdown.style.zIndex = '15000';
        dropdown.style.minWidth = '100px';
        dropdown.style.display = 'none';
        dropdown.innerHTML = `
            <button class="dropdown-logout" style="display: block; width: 100%; padding: 8px 12px; border: none; background: none; text-align: left; cursor: pointer;">🚪 登出</button>
            <button class="dropdown-delete" style="display: block; width: 100%; padding: 8px 12px; border: none; background: none; text-align: left; cursor: pointer; color: #d32f2f;">🗑️ 注销账号</button>
        `;
        document.body.appendChild(dropdown);
               // 如果当前是宁源模式，给下拉菜单添加灰度类（通过统一接口）
if (window.NingyuanTheme && typeof window.NingyuanTheme.applyGrayScaleIfNeeded === 'function') {
    window.NingyuanTheme.applyGrayScaleIfNeeded(dropdown);
} else {
    // 降级方案（如果 NingyuanTheme 未加载，直接判断）
    if (document.body.classList.contains('ningyuan-mode')) {
        dropdown.classList.add('ningyuan-grayscale');
    }
}
        
        // 定位函数：让下拉菜单出现在按钮正下方，左边缘对齐，并自动避免超出屏幕
        function positionDropdown() {
            const rect = menuBtn.getBoundingClientRect();
            // 先设置临时位置，以便获取其宽高
            dropdown.style.left = '0px';
            dropdown.style.top = '0px';
            dropdown.style.display = 'block';
            const dropdownRect = dropdown.getBoundingClientRect();
            dropdown.style.display = 'none';
            
            let left = rect.left;
            let top = rect.bottom;
            
            // 左右边界检查
            if (left + dropdownRect.width > window.innerWidth) {
                left = window.innerWidth - dropdownRect.width - 10;
            }
            if (left < 10) left = 10;
            
            // 底部空间不足时，显示在按钮上方
            if (top + dropdownRect.height > window.innerHeight) {
                top = rect.top - dropdownRect.height;
                if (top < 10) top = 10; // 避免超出顶部
            }
            
            dropdown.style.left = left + 'px';
            dropdown.style.top = top + 'px';
        }
        
        function showDropdown() {
            positionDropdown();
            dropdown.style.display = 'block';
        }
        
        function hideDropdown() {
            dropdown.style.display = 'none';
        }
        
        // 点击按钮切换下拉菜单
        menuBtn.onclick = (e) => {
            e.stopPropagation();
            if (dropdown.style.display === 'block') {
                hideDropdown();
            } else {
                showDropdown();
            }
        };
        
        // 点击其他区域关闭
        const closeHandler = (e) => {
            if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
                hideDropdown();
            }
        };
        document.addEventListener('click', closeHandler);
        
        // 滚动或窗口大小改变时自动关闭（避免位置错乱）
        const resetDropdown = () => { hideDropdown(); };
        window.addEventListener('scroll', resetDropdown);
        window.addEventListener('resize', resetDropdown);
        
        // 绑定按钮事件
        dropdown.querySelector('.dropdown-logout').onclick = () => {
            if (confirm('确定要登出吗？')) logout();
            hideDropdown();
        };
        dropdown.querySelector('.dropdown-delete').onclick = () => {
            if (confirm(`确定要注销账号「${currentUser}」吗？\n（临时账号将被删除，浏览记录及所作更改仍会保留）`)) deleteAccount();
            hideDropdown();
        };
        
        // 可选：在页面关闭或卸载时移除事件监听（非必须，但为了规范）
        window.addEventListener('beforeunload', () => {
            document.removeEventListener('click', closeHandler);
            window.removeEventListener('scroll', resetDropdown);
            window.removeEventListener('resize', resetDropdown);
        });
        
    } else {
        // 未登录状态：移除下拉菜单，恢复原始登录注册按钮
        const existingDropdown = document.getElementById('global-user-dropdown');
        if (existingDropdown) existingDropdown.remove();
        
        navRight.innerHTML = `<button class="login-btn">登陆</button><button class="register-btn">注册</button>`;
        const loginBtn = navRight.querySelector('.login-btn');
        const registerBtn = navRight.querySelector('.register-btn');
            if (loginBtn) loginBtn.onclick = showLoginModal;
            if (registerBtn) registerBtn.onclick = showRegisterModal;
    }
}
  
    // ==================== 初始化：自动恢复登录状态 ====================
function init() {
    const stored = getStoredUser();
    
    if (stored) {
        // 恢复登录状态
        currentUser = stored.username;
        
        // 根据用户类型触发不同事件
        if (currentUser === CONFIG.ADMIN_USERNAME) {
            window.dispatchEvent(new CustomEvent('auth:NingYuan-login'));
        } else {
            window.dispatchEvent(new CustomEvent('auth:login'));
        }
    } else {
        // 未登录状态
        currentUser = null;
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    
    // 触发外部状态更新回调
    if (typeof window.onAuthStateChanged === 'function') {
        window.onAuthStateChanged(currentUser);
    }
     updateNavButtons();
}
    // ==================== 暴露公共API ====================
    const Auth = {
        // 核心操作
        login,
        register,
        logout,
        deleteAccount,

        // 状态查询
        getCurrentUser,
        isAdminUser,

        // 存储（外部可调用）
        getStoredUser,
        saveUser,
        clearUser,

        // 模态框
        showLoginModal: function() { createModal('login'); },
        showRegisterModal: function() { createModal('register'); },

        // 初始化
        init,

        // 配置（只读）
        config: CONFIG
    };

    // 挂载到全局
    window.Auth = Auth;

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
  

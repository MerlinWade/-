// ================================================================
// search.js - 搜索功能模块
// 依赖：Auth 对象（由 Log&Register.js 提供）
// 功能：根据用户类型（未登录/临时账号/宁源）限制搜索引擎
// 使用：页面引入此文件后自动绑定搜索按钮和回车事件
// ================================================================

(function() {
    'use strict';

    // ---------- 搜索引擎配置（可扩展） ----------
    const SEARCH_ENGINES = {
        search: {
            label: '搜索',
            // 日后可添加实际搜索URL模板，例如：
            // url: 'https://www.baidu.com/s?wd={keyword}',
        },
        daodelao: {
            label: '地道搜索',
            // url: 'https://daodelao.example.com/search?q={keyword}',
        }
    };

    // ---------- 权限控制 ----------
    function getAvailableEngines() {
        const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
        const isAdmin = window.Auth ? window.Auth.isAdminUser() : false;
        if (!currentUser) {
            // 未登录：不允许任何搜索
            return [];
        }
        if (isAdmin) {
            // 宁源：两种引擎均可使用
            return ['search', 'daodelao'];
        } else {
            // 临时账号：仅可使用普通搜索
            return ['search'];
        }
    }

    // ---------- 核心搜索处理 ----------
    function handleSearch() {
        const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
        if (!currentUser) {
            alert('🔒 请先登录');
            return;
        }

        const searchType = document.getElementById('searchType').value;
        const searchText = document.querySelector('.search-input').value.trim();
        if (!searchText) {
            alert('请输入搜索内容');
            return;
        }

        const isAdmin = window.Auth ? window.Auth.isAdminUser() : false;
        const engineLabel = SEARCH_ENGINES[searchType]?.label || '搜索';

        // 权限检查：临时账号不能使用地道搜索
        if (!isAdmin && searchType === 'daodelao') {
            alert('❌ 此搜索引擎暂不向临时账号开放，敬请期待。');
            return;
        }

        // ====== 此处为搜索执行区，日后可替换为实际搜索逻辑 ======
        // 例如：
        // const url = SEARCH_ENGINES[searchType]?.url?.replace('{keyword}', encodeURIComponent(searchText));
        // if (url) window.location.href = url;
        // 或使用 fetch 请求本地搜索接口

        // 目前仅弹出提示（占位）
        alert(`🔍 ${engineLabel}：${searchText}\n\n搜索功能开发中...`);
    }

    // ---------- 绑定事件 ----------
    function bindEvents() {
        const searchBtn = document.querySelector('.search-btn');
        const searchInput = document.querySelector('.search-input');
        if (searchBtn) {
            searchBtn.addEventListener('click', handleSearch);
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }
    }

    // ---------- 初始化 ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
        bindEvents();
    }

    // 暴露搜索函数以便外部调用（可选）
    window.Search = {
        handleSearch,
        getAvailableEngines
    };

})();

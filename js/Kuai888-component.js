// ================================================================
// Kuai888-component.js - 公共组件加载器
// 功能：从 HTML 片段中提取导航栏、虚拟页脚、真实页脚并插入页面
// 使用：在页面中放置对应 ID 的占位容器，引入此脚本即可
// ================================================================

(function() {
    const COMPONENTS_URL = 'html-component/Kuai888-component.html';

    function loadComponents() {
        // 检查页面中是否存在需要注入的占位容器
        const navbarPlaceholder = document.getElementById('navbar-placeholder');
        const virtualFooterPlaceholder = document.getElementById('virtual-footer-placeholder');
        const realFooterPlaceholder = document.getElementById('real-footer-placeholder');

        // 如果没有任何占位容器，说明该页面不需要加载组件，直接返回
        if (!navbarPlaceholder && !virtualFooterPlaceholder && !realFooterPlaceholder) {
            return;
        }

        fetch(COMPONENTS_URL)
            .then(response => {
                if (!response.ok) throw new Error('无法加载公共组件');
                return response.text();
            })
            .then(html => {
                // 利用 DOMParser 解析 HTML 片段
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // 按 ID 提取对应元素，并插入到占位容器中
                if (navbarPlaceholder) {
                    const navbar = doc.getElementById('navbar-component');
                    if (navbar) navbarPlaceholder.innerHTML = navbar.innerHTML;
                }
                if (virtualFooterPlaceholder) {
                    const vFooter = doc.getElementById('virtual-footer-component');
                    if (vFooter) virtualFooterPlaceholder.innerHTML = vFooter.innerHTML;
                }
                if (realFooterPlaceholder) {
                    const rFooter = doc.getElementById('real-footer-component');
                    if (rFooter) realFooterPlaceholder.innerHTML = rFooter.innerHTML;
                }

                // 注入完成后，重新绑定搜索功能（因为 search.js 会在 DOM 加载时绑定，如果组件晚于它加载，需要手动触发）
                // 如果你在 search.js 中使用了 window.Search 绑定，可以在这里调用
                if (window.Search && typeof window.Search.bindEvents === 'function') {
                    window.Search.bindEvents();
                }
            })
            .catch(err => {
                console.warn('公共组件加载失败，使用备用内容', err);
                // 可设置备用内容（例如硬编码在 JS 中），但为简洁起见略过
            });
    }

    // 确保在 DOM 加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComponents);
    } else {
        loadComponents();
    }
})();

// ================================================================
// Footer.js - 真实页脚动态加载
// 功能：在页面中指定的容器内插入真实页脚 HTML
// 使用：在页面中放置 <div id="footer-container"></div>，然后引入此脚本
// ================================================================

(function() {
    // 配置页脚文件路径（根据实际目录调整）
    const FOOTER_URL = 'Footer.html';

    function loadFooter() {
        const container = document.getElementById('footer-container');
        if (!container) {
            console.warn('未找到 #footer-container，无法加载真实页脚');
            return;
        }

        fetch(FOOTER_URL)
            .then(response => {
                if (!response.ok) throw new Error('无法加载页脚文件');
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
            })
            .catch(err => {
                console.warn('真实页脚加载失败，使用默认内容');
                // 可在此设置备用内容
                container.innerHTML = `
                    <div class="real-footer">
                        <p>本网站的内容为虚构游戏作品，与任何真实的人物、团体或事件无关。</p>
                        <p>© 2026 MerlinWade. All rights reserved. | 本作品受著作权保护。未经许可，不得以任何形式转载或复制。</p>
                    </div>
                `;
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFooter);
    } else {
        loadFooter();
    }
})();

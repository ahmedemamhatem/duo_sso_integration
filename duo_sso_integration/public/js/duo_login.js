frappe.ready(function () {
    frappe.call({
        method: "duo_sso_integration.api.oauth.get_sso_settings_info",
        args: { provider: "duo" },
        callback: function (duo) {
            frappe.call({
                method: "duo_sso_integration.api.oauth.get_sso_settings_info",
                args: { provider: "ms" },
                callback: function (ms) {
                    let duoEnabled = duo.message && (duo.message.enable == 1 || duo.message.enable === "1");
                    let msEnabled = ms.message && (ms.message.enable == 1 || ms.message.enable === "1");

                    let disableNormalLogin = (duo.message && (duo.message.disable_normal_login == 1 || duo.message.disable_normal_login === "1"))
                        || (ms.message && (ms.message.disable_normal_login == 1 || ms.message.disable_normal_login === "1"));

                    let loginForm = document.querySelector('form[data-login-form]')
                        || document.querySelector('.page-card')
                        || document.querySelector('form');
                    if (!loginForm) return;

                    // Get the main login button as reference
                    const loginBtn = loginForm.querySelector('button[type="submit"]');
                    const loginBtnClasses = loginBtn ? Array.from(loginBtn.classList) : ['btn', 'btn-primary', 'btn-block'];
                    const loginBtnStyle = loginBtn ? loginBtn.getAttribute('style') : 'width:100%;margin:12px 0;';

                    function insertAfter(newNode, referenceNode) {
                        if (referenceNode.nextSibling) {
                            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
                        } else {
                            referenceNode.parentNode.appendChild(newNode);
                        }
                    }

                    // SVGs
                    const duoLogoSVG = `<span class="sso-icon" style="margin-right:10px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 211.1 102.4" width="34" height="16" aria-label="Duo logo"><g><path style="opacity:.8;fill:#74bf4b" d="M.3,102.4h34c18.2,0,33.1-14.3,34-32.3H.3v32.3h0Z"/><path style="fill:#74bf4b" d="M34.3,34.3H.3v32.3h68c-.9-18-15.8-32.3-34-32.3"/><path style="fill:#74bf4b" d="M177.2,34.3c-18.2,0-33.1,14.3-34,32.3h67.9c-.9-18-15.8-32.3-34-32.3"/><path style="opacity:.8;fill:#74bf4b" d="M177.2,102.4c18.2,0,33.1-14.3,34-32.3h-67.9c.9,18,15.8,32.3,34,32.3"/><path style="fill:#74bf4b" d="M71.7,34.3v34c0,18.2,14.3,33.1,32.3,34V34.3h-32.3Z"/><polygon style="opacity:.8;fill:#74bf4b" points="107.4 34.3 107.4 102.4 139.8 102.4 139.8 68.3 139.8 34.3 107.4 34.3"/></g></svg></span>`;
                    const msLogoSVG = `<span class="sso-icon" style="margin-right:10px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="22" height="22" aria-label="Microsoft logo"><rect width="14" height="14" x="1" y="1" fill="#f35325"/><rect width="14" height="14" x="17" y="1" fill="#81bc06"/><rect width="14" height="14" x="1" y="17" fill="#05a6f0"/><rect width="14" height="14" x="17" y="17" fill="#ffba08"/><rect width="30" height="30" x="1" y="1" fill="none" stroke="#ccc" stroke-width="0.6"/></svg></span>`;

                    // Remove previous SSO buttons if any (avoid dupes)
                    loginForm.querySelectorAll('.sso-btn').forEach(el => el.remove());

                    // Place SSO buttons after main login button
                    let lastInserted = loginBtn;

                    // Microsoft SSO button
                    if (msEnabled) {
                        const msBtn = document.createElement('button');
                        msBtn.type = "button";
                        msBtn.className = [...loginBtnClasses, 'sso-btn', 'ms'].join(' ');
                        msBtn.style = loginBtnStyle || 'width:100%;margin:12px 0;';
                        msBtn.innerHTML = `${msLogoSVG}<span class="sso-text">Sign in with Microsoft</span>`;
                        msBtn.onclick = function () {
                            showSsoStatus("Redirecting to Microsoft SSO...", "#0078d4");
                            window.location.href = "/api/method/duo_sso_integration.api.oauth.start?provider=ms";
                        };
                        insertAfter(msBtn, lastInserted);
                        lastInserted = msBtn;
                    }

                    // Duo SSO button
                    if (duoEnabled) {
                        const duoBtn = document.createElement('button');
                        duoBtn.type = "button";
                        duoBtn.className = [...loginBtnClasses, 'sso-btn', 'duo'].join(' ');
                        duoBtn.style = loginBtnStyle || 'width:100%;margin:12px 0;';
                        duoBtn.innerHTML = `${duoLogoSVG}<span class="sso-text">Sign in with Duo</span>`;
                        duoBtn.onclick = function () {
                            showSsoStatus("Waiting for Duo Push approval...", "#74bf4b");
                            window.location.href = "/api/method/duo_sso_integration.api.oauth.start?provider=duo";
                        };
                        insertAfter(duoBtn, lastInserted);
                        lastInserted = duoBtn;
                    }

                    // Hide classic login form fields if either disables normal login
                    if (disableNormalLogin) {
                        loginForm.querySelectorAll('input, label, .form-group').forEach(el => el.style.display = "none");
                        loginForm.querySelectorAll(
                            '.es-lock, a.forgot-password, a[href*="forgot"], .es-line-lock, .toggle-password.text-muted, .field-icon.password-icon'
                        ).forEach(el => el.style.display = "none");
                        if (loginBtn) loginBtn.style.display = "none";
                    }

                    // Inject minimal SSO CSS if not yet present
                    if (!document.getElementById('sso-css')) {
                        const style = document.createElement('style');
                        style.id = 'sso-css';
                        style.textContent = `
.sso-btn.ms {
    background: linear-gradient(90deg, #0078d4 0%, #61aeee 100%) !important;
    color: #fff !important;
    border: none !important;
}
.sso-btn.duo {
    background: linear-gradient(90deg, #74bf4b 0%, #b6e099 100%) !important;
    color: #fff !important;
    border: none !important;
}
.sso-btn .sso-icon {
    display: inline-block;
    vertical-align: middle;
    margin-bottom: -2px;
}
.sso-btn .sso-text {
    font-weight: 700;
    letter-spacing: 0.01em;
    font-size: 1em;
    vertical-align: middle;
}
.sso-btn:focus, .sso-btn:focus-visible {
    outline: 2.5px solid #0078d4;
    outline-offset: 2px;
    box-shadow: 0 0 0 2.5px #0078d466;
    transform: scale(1.015);
}
.sso-btn.duo:focus, .sso-btn.duo:focus-visible { outline-color: #74bf4b; }
@media (max-width: 600px) {
    .sso-btn { font-size: 0.96em; }
}
                        `;
                        document.head.appendChild(style);
                    }
                }
            });
        }
    });
});

// SSO Status Overlay (shared for both)
function showSsoStatus(msg, color) {
    let overlay = document.getElementById('sso-status');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sso-status';
        overlay.innerHTML = `
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(255,255,255,0.82);display:flex;align-items:center;justify-content:center;">
                <div style="text-align:center;">
                    <div class="duo-spinner" style="margin-bottom:18px;">
                        <svg width="48" height="48" viewBox="0 0 50 50" aria-label="Loading...">
                            <circle cx="25" cy="25" r="20" stroke="${color||'#0078d4'}" stroke-width="5" fill="none" stroke-linecap="round">
                                <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 25 25" to="360 25 25" repeatCount="indefinite"/>
                            </circle>
                        </svg>
                    </div>
                    <div style="font-size:1.15em;font-weight:600;color:${color||'#0078d4'};">${msg}</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('div[style*="font-size"]').innerText = msg;
        overlay.querySelector('circle').setAttribute('stroke', color || '#0078d4');
        overlay.style.display = 'flex';
    }
}
function hideSsoStatus() {
    let overlay = document.getElementById('sso-status');
    if (overlay) overlay.style.display = 'none';
}
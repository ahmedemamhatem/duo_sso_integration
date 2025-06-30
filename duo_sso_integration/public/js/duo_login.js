frappe.ready(function () {
    frappe.call({
        method: "duo_sso_integration.api.oauth.get_duo_sso_settings",
        callback: function (r) {
            let disableNormalLogin = r.message && (r.message.disable_normal_login === 1 || r.message.disable_normal_login === "1");

            let loginForm =
                document.querySelector('form[data-login-form]') ||
                document.querySelector('.page-card') ||
                document.querySelector('form');
            if (!loginForm || document.getElementById('duo-sso-btn')) return;

            // Inject CSS
            if (!document.getElementById('duo-sso-css')) {
                const style = document.createElement('style');
                style.id = 'duo-sso-css';
                style.textContent = `
#duo-sso-label {
    display: flex;
    align-items: center;
    font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
    font-weight: 800;
    font-size: 1.28em;
    letter-spacing: 0.01em;
    color: #1F2B35;
    gap: 0.7em;
    margin: 34px 0 14px 0;
    animation: duoFadeIn 0.7s cubic-bezier(.39,.58,.57,1.01);
}
#duo-sso-label span {
    display: inline-block;
    vertical-align: middle;
}
#duo-sso-label .duo-head {
    color: #74bf4b;
    font-weight: 800;
    text-shadow: 0 1px 6px rgba(116,191,75,0.11);
}
#duo-sso-label .duo-brand {
    color: #4d4d4f;
    font-weight: 900;
    letter-spacing: 0.03em;
    text-shadow: 0 1px 12px rgba(77,77,79,0.09);
}
#duo-sso-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1em;
    background: linear-gradient(100deg, #74bf4b 0%, #b6e099 60%, #4d4d4f 100%);
    color: #fff;
    font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
    font-weight: 800;
    font-size: 1.09em;
    padding: 0.95em 1.4em;
    border-radius: 11px;
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    margin-bottom: 8px;
    margin-top: 0;
    box-shadow: 0 4px 24px rgba(77,77,79,0.10), 0 1.5px 6px rgba(116,191,75,.09);
    background-size: 250% auto;
    background-position: left center;
    transition: 
        background-position 0.55s cubic-bezier(.42,.73,.51,1.02),
        box-shadow 0.20s,
        transform 0.18s;
    animation: duoFadeIn 0.88s cubic-bezier(.39,.58,.57,1.01);
}
#duo-sso-btn:hover, #duo-sso-btn:focus {
    background-position: right center;
    box-shadow: 0 8px 32px 0 rgba(77,77,79,0.19), 0 2px 12px rgba(116,191,75,.11);
    transform: translateY(-2px) scale(1.022);
    outline: none;
}
#duo-sso-btn:focus-visible {
    outline: 2.5px solid #74bf4b;
    outline-offset: 2.5px;
}
#duo-sso-btn .duo-icon {
    flex-shrink: 0;
    display: inline-block;
    vertical-align: middle;
    transition: filter 0.3s, transform 0.3s;
    will-change: transform, filter;
}
#duo-sso-btn:hover .duo-icon,
#duo-sso-btn:focus .duo-icon {
    animation: duoPulse 0.75s cubic-bezier(.46,.03,.52,.96) 1;
    filter: drop-shadow(0 0 10px #74bf4b66) brightness(1.09);
    transform: scale(1.10) rotate(-7deg);
}
#duo-sso-btn .duo-text {
    font-weight: 900;
    letter-spacing: 0.01em;
    line-height: 1.23;
    font-size: 1.03em;
    color: #111;
    text-shadow: none;
    display: inline-block;
}
#duo-sso-btn .duo-accent {
    color: #74bf4b;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-shadow: none;
}
#duo-sso-btn svg {
    width: 50px;
    height: 24px;
}
@keyframes duoPulse {
    0% { transform: scale(1) rotate(0deg);}
    40% { transform: scale(1.19) rotate(-11deg);}
    60% { transform: scale(1.1) rotate(-7deg);}
    100% { transform: scale(1.10) rotate(-7deg);}
}
@keyframes duoFadeIn {
    from { opacity: 0; transform: translateY(18px);}
    to   { opacity: 1; transform: translateY(0);}
}
@media (max-width: 520px) {
    #duo-sso-btn { font-size: 0.98em; padding: 0.70em 0.9em;}
    #duo-sso-label { font-size: 1em; }
    #duo-sso-btn .duo-icon svg { width: 34px; height: 16px; }
}
                `;
                document.head.appendChild(style);
            }

            // Official Cisco Duo Logo SVG from duo.com/images/duo-logo.svg
            const duoLogoSVG = `
<span class="duo-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 211.1 102.4" width="50" height="24" aria-label="Duo logo">
  <defs>
    <style>
      .st0 { fill: #4d4d4f; }
      .st1 { opacity: .8; fill: #74bf4b; }
      .st2 { fill: #74bf4b; }
    </style>
  </defs>
  <g>
    <path class="st1" d="M.3,102.4h34c18.2,0,33.1-14.3,34-32.3H.3v32.3h0Z"/>
    <path class="st2" d="M34.3,34.3H.3v32.3h68c-.9-18-15.8-32.3-34-32.3"/>
    <path class="st2" d="M177.2,34.3c-18.2,0-33.1,14.3-34,32.3h67.9c-.9-18-15.8-32.3-34-32.3"/>
    <path class="st1" d="M177.2,102.4c18.2,0,33.1-14.3,34-32.3h-67.9c.9,18,15.8,32.3,34,32.3"/>
    <path class="st2" d="M71.7,34.3v34c0,18.2,14.3,33.1,32.3,34V34.3h-32.3Z"/>
    <polygon class="st1" points="107.4 34.3 107.4 102.4 139.8 102.4 139.8 68.3 139.8 34.3 107.4 34.3"/>
  </g>
  <g>
    <rect class="st0" x="18.7" y=".3" width="4.3" height="17"/>
    <path class="st0" d="M44.4,8.8c0,5.5,4.2,8.8,9,8.8s3.3-.5,3.9-.6v-4.6c-.2,0-1.6.9-3.6.9-2.8,0-4.7-2-4.7-4.5s1.9-4.5,4.7-4.5,3.4.8,3.6.9V.6c-.4-.1-1.9-.6-3.9-.6-5.2,0-9,3.7-9,8.8Z"/>
    <path class="st0" d="M0,8.8c0,5.5,4.2,8.8,9,8.8s3.3-.5,3.9-.6v-4.6c-.2,0-1.6.9-3.6.9-2.8,0-4.7-2-4.7-4.5s1.9-4.5,4.7-4.5,3.4.8,3.6.9V.6c-.4-.1-1.9-.6-3.9-.6C3.8,0,0,3.7,0,8.8Z"/>
    <path class="st0" d="M70.6,0c-5.2,0-8.9,3.9-8.9,8.8s3.7,8.8,8.9,8.8,8.9-3.9,8.9-8.8S75.8,0,70.6,0ZM70.6,13.3c-2.5,0-4.4-2-4.4-4.5s1.9-4.5,4.4-4.5,4.4,2,4.4,4.5-1.9,4.5-4.4,4.5Z"/>
    <path class="st0" d="M36.2,7l-1.2-.4c-.7-.2-1.9-.6-1.9-1.6s.9-1.4,2.6-1.4,3.3.5,3.3.5V.5c-.1,0-2.1-.5-4.1-.5-3.9,0-6.3,2.1-6.3,5.3s2,4.2,4.3,5c.3,0,.7.2.9.3,1.1.3,1.9.8,1.9,1.7s-1,1.6-3.1,1.6-3.6-.5-4-.6v3.9c.2,0,2.3.5,4.6.5,3.3,0,7-1.4,7-5.7s-1.3-4-4-4.9Z"/>
  </g>
</svg>
</span>`;

            // Label above the button
            const ssoLabel = document.createElement('div');
            ssoLabel.id = 'duo-sso-label';
            ssoLabel.innerHTML = `
                ${duoLogoSVG}
                <span>
                  <span class="duo-head">Sign in with</span> 
                  <span class="duo-brand">Duo SSO</span>
                </span>
            `;

            // The Button
            const ssoBtn = document.createElement('button');
            ssoBtn.type = "button";
            ssoBtn.id = "duo-sso-btn";
            ssoBtn.innerHTML = `
                ${duoLogoSVG}
                <span class="duo-text">Continue with <span class="duo-accent">Duo</span></span>
            `;
            ssoBtn.onclick = function () {
                window.location.href = "/api/method/duo_sso_integration.api.oauth.start";
            };

            // Insert label and button
            const loginBtn = loginForm.querySelector('button[type="submit"]');
            if (loginBtn && loginBtn.parentNode) {
                loginBtn.parentNode.insertBefore(ssoLabel, loginBtn.nextSibling);
                loginBtn.parentNode.insertBefore(ssoBtn, ssoLabel.nextSibling);
            } else {
                loginForm.appendChild(ssoLabel);
                loginForm.appendChild(ssoBtn);
            }

            // Disable default login form and hide icons/links if needed
            if (disableNormalLogin) {
                if (loginBtn) loginBtn.style.display = "none";
                loginForm.querySelectorAll('input, label').forEach(el => el.style.display = "none");
                document.querySelectorAll(
                    '.es-lock, a.forgot-password, a[href*="forgot"], .es-line-lock, .toggle-password.text-muted, .field-icon.password-icon'
                ).forEach(el => el.style.display = "none");
            }
        }
    });
});
import frappe
import requests
import urllib.parse
import secrets
import base64
import hashlib


@frappe.whitelist(allow_guest=True)
def get_duo_sso_settings():
    """
    Returns public Duo SSO login settings for guest access.
    """
    settings = frappe.get_single("Duo SSO Settings")
    return {
        "disable_normal_login": getattr(settings, "disable_normal_login", 0)
    }

@frappe.whitelist(allow_guest=True)
def start():
    """
    Initiates the Duo SSO login flow by redirecting to the Duo authorization endpoint.
    Uses PKCE for enhanced security (generates state, nonce, and code_challenge).
    Stores state-related values in cache for validation in the callback.
    """
    settings = frappe.get_single("Duo SSO Settings")
    state = secrets.token_urlsafe(16)
    nonce = secrets.token_urlsafe(16)
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b"=").decode("utf-8")

    # Cache PKCE and nonce values for later validation (10 min expiry)
    frappe.cache().set_value(
        f"duo_sso_state_{state}",
        {"nonce": nonce, "code_verifier": code_verifier},
        expires_in_sec=600,
    )

    # Build the Duo authorization URL
    auth_url = (
        f"{settings.authorization_url}?client_id={settings.client_id}"
        f"&response_type=code"
        f"&scope=openid email"
        f"&redirect_uri={urllib.parse.quote(settings.redirect_uri)}"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
        f"&nonce={nonce}"
    )
    # Redirect the user to the Duo SSO login page
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = auth_url

@frappe.whitelist(allow_guest=True)
def callback(code=None, state=None):
    """
    Handles the OAuth2 callback from Duo SSO.
    Verifies the state, exchanges the code for tokens, fetches user info,
    and either logs in or provisions the user.
    """
    if not state or not code:
        frappe.throw("Missing state or code from SSO provider.")

    # Retrieve and validate PKCE/nonce data from cache
    cache_data = frappe.cache().get_value(f"duo_sso_state_{state}")
    if not cache_data:
        frappe.throw("Invalid or expired state (possible CSRF protection).")

    settings = frappe.get_single("Duo SSO Settings")
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.redirect_uri,
        "client_id": settings.client_id,
        "client_secret": settings.client_secret,
        "code_verifier": cache_data["code_verifier"]
    }
    # Exchange code for access token
    token_resp = requests.post(settings.token_url, data=data, timeout=10)
    if token_resp.status_code != 200:
        frappe.throw(f"Token exchange failed: {token_resp.status_code} {token_resp.text}")

    tokens = token_resp.json()
    access_token = tokens.get("access_token")
    if not access_token:
        frappe.throw("No access token received from SSO provider.")

    # Fetch user info
    userinfo_resp = requests.get(
        settings.userinfo_url,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if userinfo_resp.status_code != 200:
        frappe.throw(f"User info fetch failed: {userinfo_resp.status_code} {userinfo_resp.text}")

    userinfo = userinfo_resp.json()
    email = userinfo.get("email")
    if not email:
        frappe.throw("No email address returned by SSO provider.")

    # Log in or provision the user
    from duo_sso_integration.utils.auth import login_or_signup
    login_or_signup(email)

    # Redirect to ERPNext desk/home
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = "/app"
import frappe
import requests
import urllib.parse
import secrets
import base64
import hashlib

def get_sso_settings(provider):
    """Fetch SSO settings based on provider."""
    if provider == "ms":
        doctype = "MS SSO Settings"
    else:
        doctype = "Duo SSO Settings"
    return frappe.get_single(doctype)

@frappe.whitelist(allow_guest=True)
def get_sso_settings_info(provider="duo"):
    """
    Returns public SSO login settings for guest access.
    """
    settings = get_sso_settings(provider)
    return {
        "enable": getattr(settings, "enable", 0),
        "disable_normal_login": getattr(settings, "disable_normal_login", 0),
        "client_id": getattr(settings, "client_id", ""),
        "scope": getattr(settings, "scope", ""),
        "tenant_id": getattr(settings, "tenant_id", ""),
        "authority_url": getattr(settings, "authority_url", ""),
        "authorization_endpoint": getattr(settings, "authorization_endpoint", ""),
        "token_endpoint": getattr(settings, "token_endpoint", ""),
        "userinfo_endpoint": getattr(settings, "userinfo_endpoint", ""),
        "redirect_uri": getattr(settings, "redirect_uri", "")
    }

@frappe.whitelist(allow_guest=True)
def start(provider="duo"):
    """
    Initiates the SSO login flow by redirecting to the authorization endpoint.
    Uses PKCE for enhanced security (generates state, nonce, and code_challenge).
    Stores state-related values in cache for validation in the callback.
    """
    settings = get_sso_settings(provider)
    state = secrets.token_urlsafe(16)
    nonce = secrets.token_urlsafe(16)
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b"=").decode("utf-8")

    # Cache PKCE and nonce values for later validation (10 min expiry)
    frappe.cache().set_value(
        f"sso_state_{provider}_{state}",
        {"nonce": nonce, "code_verifier": code_verifier, "provider": provider},
        expires_in_sec=600,
    )

    # Build the authorization URL dynamically from DocType
    auth_url = getattr(settings, "authorization_endpoint", None)
    client_id = getattr(settings, "client_id", "")
    scope = getattr(settings, "scope", "openid email")
    redirect_uri = getattr(settings, "redirect_uri", frappe.utils.get_url("/api/method/duo_sso_integration.api.oauth.callback"))
    # fallback to old field for backwards compatibility
    if not auth_url:
        if provider == "ms":
            authority_url = getattr(settings, "authority_url", "")
            auth_url = f"{authority_url}/oauth2/v2.0/authorize"
        else:
            auth_url = getattr(settings, "authorization_url", "")

    params = {
        "client_id": client_id,
        "response_type": "code",
        "scope": scope,
        "redirect_uri": redirect_uri,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "nonce": nonce
    }
    # Build URL with proper encoding
    url = auth_url + "?" + urllib.parse.urlencode(params)

    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = url

@frappe.whitelist(allow_guest=True)
def callback(code=None, state=None, provider="duo"):
    """
    Handles the OAuth2 callback from the SSO provider.
    Verifies the state, exchanges the code for tokens, fetches user info,
    and either logs in or provisions the user.
    """
    if not state or not code:
        frappe.throw("Missing state or code from SSO provider.")

    # Retrieve and validate PKCE/nonce data from cache
    cache_data = frappe.cache().get_value(f"sso_state_{provider}_{state}")
    if not cache_data:
        frappe.throw("Invalid or expired state (possible CSRF protection).")

    settings = get_sso_settings(provider)
    token_endpoint = getattr(settings, "token_endpoint", None)
    if not token_endpoint:
        # fallback for backward compatibility
        if provider == "ms":
            authority_url = getattr(settings, "authority_url", "")
            token_endpoint = f"{authority_url}/oauth2/v2.0/token"
        else:
            token_endpoint = getattr(settings, "token_url", "")

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": getattr(settings, "redirect_uri", frappe.utils.get_url("/api/method/duo_sso_integration.api.oauth.callback")),
        "client_id": getattr(settings, "client_id", ""),
        "client_secret": getattr(settings, "client_secret", ""),
        "code_verifier": cache_data["code_verifier"]
    }

    # Exchange code for access token
    token_resp = requests.post(token_endpoint, data=data, timeout=10)
    if token_resp.status_code != 200:
        frappe.throw(f"Token exchange failed: {token_resp.status_code} {token_resp.text}")

    tokens = token_resp.json()
    access_token = tokens.get("access_token")
    if not access_token:
        frappe.throw("No access token received from SSO provider.")

    # Fetch user info
    userinfo_endpoint = getattr(settings, "userinfo_endpoint", None)
    if not userinfo_endpoint:
        if provider == "ms":
            userinfo_endpoint = "https://graph.microsoft.com/oidc/userinfo"
        else:
            userinfo_endpoint = getattr(settings, "userinfo_url", "")

    userinfo_resp = requests.get(
        userinfo_endpoint,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if userinfo_resp.status_code != 200:
        frappe.throw(f"User info fetch failed: {userinfo_resp.status_code} {userinfo_resp.text}")

    userinfo = userinfo_resp.json()
    email = userinfo.get("email")
    # For Microsoft, fallback to "preferred_username"
    if not email and provider == "ms":
        email = userinfo.get("preferred_username")
    if not email:
        frappe.throw("No email address returned by SSO provider.")

    # Log in or provision the user
    from duo_sso_integration.utils.auth import login_or_signup
    login_or_signup(email)

    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = "/app"
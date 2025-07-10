import frappe
import requests
import jwt
from frappe.utils import validate_email_address

@frappe.whitelist(allow_guest=True)
def ms_oauth_callback():
    code = frappe.local.form_dict.get("code")
    if not code:
        frappe.respond_as_web_page("Error", "Missing Microsoft OAuth code.")
        return

    ms_settings = frappe.get_single("MS SSO Settings")
    client_id = ms_settings.client_id
    client_secret = ms_settings.client_secret
    scope = ms_settings.scope or "openid email profile"
    redirect_uri = ms_settings.redirect_uri if hasattr(ms_settings, "redirect_uri") else None
    token_url = ms_settings.token_endpoint

    # Fallback if redirect_uri field not present
    if not redirect_uri:
        # As a fallback, you could hardcode it or throw an error
        frappe.respond_as_web_page("Error", "Redirect URI not configured in MS SSO Settings.")
        return

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": scope
    }
    response = requests.post(token_url, data=data)
    if not response.ok:
        frappe.respond_as_web_page("OAuth Error", f"Microsoft token exchange failed: {response.text}")
        return

    token_data = response.json()
    id_token = token_data.get("id_token")
    if not id_token:
        frappe.respond_as_web_page("OAuth Error", "No id_token in Microsoft response.")
        return

    # Decode id_token (for demo; verify signature in production!)
    user_info = jwt.decode(id_token, options={"verify_signature": False, "verify_aud": False})
    email = user_info.get("email") or user_info.get("upn") or user_info.get("preferred_username")
    if not email:
        frappe.respond_as_web_page("OAuth Error", "No email in Microsoft id_token.")
        return

    login_or_signup(email, provider="ms")
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = "/app"

@frappe.whitelist(allow_guest=True)
def duo_oauth_callback():
    code = frappe.local.form_dict.get("code")
    if not code:
        frappe.respond_as_web_page("Error", "Missing Duo OAuth code.")
        return

    duo_settings = frappe.get_single("Duo SSO Settings")
    client_id = duo_settings.client_id
    client_secret = duo_settings.client_secret
    scope = getattr(duo_settings, "scope", "openid email profile")
    redirect_uri = duo_settings.redirect_uri
    token_url = duo_settings.token_url

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": scope
    }
    response = requests.post(token_url, data=data)
    if not response.ok:
        frappe.respond_as_web_page("OAuth Error", f"Duo token exchange failed: {response.text}")
        return

    token_data = response.json()
    id_token = token_data.get("id_token")
    if not id_token:
        frappe.respond_as_web_page("OAuth Error", "No id_token in Duo response.")
        return

    user_info = jwt.decode(id_token, options={"verify_signature": False, "verify_aud": False})
    email = user_info.get("email") or user_info.get("upn") or user_info.get("preferred_username")
    if not email:
        frappe.respond_as_web_page("OAuth Error", "No email in Duo id_token.")
        return

    login_or_signup(email, provider="duo")
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = "/app"

def login_or_signup(email, provider="duo"):
    if not email:
        frappe.throw("No email provided for login or signup.")
    email = email.strip().lower()
    try:
        validate_email_address(email)
    except Exception:
        frappe.throw("Invalid email address.")

    doctype = "MS SSO Settings" if provider == "ms" else "Duo SSO Settings"
    try:
        provision = frappe.db.get_single_value(doctype, "provision_new_users")
        provision = int(provision) if provision is not None else 1
    except frappe.DoesNotExistError:
        provision = 1

    user = frappe.db.get("User", {"email": email})

    if not user:
        if not provision:
            frappe.throw("Automatic user provisioning is disabled. Please contact your administrator.")

        user_doc = frappe.get_doc({
            "doctype": "User",
            "email": email,
            "first_name": email.split("@")[0],
            "enabled": 1,
            "user_type": "System User",
            "new_password": frappe.generate_hash()
        })
        user_doc.flags.ignore_permissions = True
        user_doc.flags.no_welcome_mail = True
        user_doc.insert()
        user_doc.add_roles("System User")
        user_email = user_doc.email
        frappe.db.commit()
    else:
        user_email = user.get("email")
        frappe.db.set_value("User", user_email, "enabled", 1)
        frappe.db.commit()

    frappe.local.login_manager.login_as(user_email)
    return {"status": "success", "email": user_email}

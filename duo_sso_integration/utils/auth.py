import frappe

def login_or_signup(email, provider="duo"):
    """
    Logs in the user if they exist, otherwise creates a new enabled user
    with 'System User' role and then logs them in, if allowed by settings.

    Args:
        email (str): The email address of the user to log in or create.
        provider (str): 'duo' (default) or 'ms'. Determines which settings to check.

    Raises:
        frappe.ValidationError: If the email is not provided or provisioning is disabled.
    """
    if not email:
        frappe.throw("No email provided for login or signup.")

    email = email.strip().lower()
    user = frappe.db.get("User", {"email": email})

    # Get provisioning setting from correct DocType
    if provider == "ms":
        doctype = "MS SSO Settings"
    else:
        doctype = "Duo SSO Settings"

    provision = frappe.db.get_single_value(doctype, "provision_new_users")
    if provision is None:
        # Default to enabled if field doesn't exist (for backward compatibility)
        provision = 1

    if not user:
        if not int(provision):
            frappe.throw("Automatic user provisioning is disabled. Please contact your administrator.")
        # Create new user
        user = frappe.get_doc({
            "doctype": "User",
            "email": email,
            "first_name": email.split("@")[0],
            "enabled": 1,
            "user_type": "System User",
            "new_password": frappe.generate_hash()
        })
        user.flags.ignore_permissions = True
        user.insert()
        user.add_roles("System User")
        frappe.db.commit()
    else:
        # Ensure user is enabled
        frappe.db.set_value("User", email, "enabled", 1)

    # Log in as this user
    frappe.local.login_manager.login_as(email)
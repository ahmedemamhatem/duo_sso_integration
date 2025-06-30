import frappe

def login_or_signup(email):
    """
    Logs in the user if they exist, otherwise creates a new enabled user
    with 'System User' role and then logs them in, if allowed by settings.

    Args:
        email (str): The email address of the user to log in or create.

    Raises:
        frappe.ValidationError: If the email is not provided or provisioning is disabled.
    """
    if not email:
        frappe.throw("No email provided for login or signup.")

    user = frappe.db.get("User", {"email": email})
    if not user:
        # Fetch provision setting
        provision = frappe.db.get_single_value("Duo SSO Settings", "provision_new_users")
        if not provision:
            frappe.throw("Automatic user provisioning is disabled. Please contact your administrator.")
        # Provision a new user
        user = frappe.get_doc({
            "doctype": "User",
            "email": email,
            "first_name": email.split("@")[0],
            "enabled": 1,
            "user_type": "System User",
            "new_password": frappe.generate_hash()
        })
        user.insert(ignore_permissions=True)
        user.add_roles("System User")  # Assign default system role
        frappe.db.commit()
    else:
        # Make sure user is enabled (optional safety)
        frappe.db.set_value("User", email, "enabled", 1)

    # Log in as this user
    frappe.local.login_manager.login_as(email)
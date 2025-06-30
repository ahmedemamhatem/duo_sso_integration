# Duo SSO Integration for Frappe/ERPNext

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](license.txt)

Repository: [https://github.com/ahmedemamhatem/duo_sso_integration](https://github.com/ahmedemamhatem/duo_sso_integration)

---

This app enables seamless [Cisco Duo](https://duo.com/) Single Sign-On (SSO) for your Frappe or ERPNext site, providing a secure, modern, and branded authentication experience. The login page features the official Duo logo, an animated SSO button, and a responsive design. All branding is inline, so your login always looks professional and is not affected by external asset changes.

---

## Features

- **Cisco Duo SSO login:**  
  Users authenticate through your organization's existing Duo SSO provider.
- **Duo-branded experience:**  
  Official Duo logo and color scheme on the login page.
- **Animated, accessible SSO button:**  
  Modern look with smooth transitions and high accessibility.
- **Mobile-friendly:**  
  Responsive design for all devices.
- **Configurable:**  
  Optionally hides standard ERPNext login fields and "Forgot Password?" links for SSO-only environments.
- **Inline branding:**  
  The Duo logo is embedded as SVG, ensuring reliability regardless of Duo's website changes.

---

## Screenshots

<!--
If you have screenshots, place them in the repo (e.g., `docs/`) and display them here:

![Login Page with Duo SSO Button](docs/login-duo-sso.png)
-->

---

## Installation

### Prerequisites

- A running [Frappe](https://frappe.io/) or [ERPNext](https://erpnext.com/) site (v13 or above recommended)
- Bench CLI access
- Cisco Duo SSO enabled for your organization

### Steps

1. **Get the app**

    ```sh
    cd /path/to/frappe-bench
    bench get-app https://github.com/ahmedemamhatem/duo_sso_integration.git
    ```

2. **Install the app on your site**

    ```sh
    bench --site your-site-name install-app duo_sso_integration
    ```

3. **Migrate your site (if required)**

    ```sh
    bench --site your-site-name migrate
    ```

---

## Configuration

1. **Duo SSO Credentials:**  
   Open the Duo SSO Integration settings in your Frappe/ERPNext Desk and fill in your Duo SSO credentials (Client ID, Secret, API Host, etc.).

2. **Disable Normal Login (Optional):**  
   In the integration settings, set **Disable Normal Login** to `1` to hide the username/password fields and force SSO-only login.

3. **Customize Branding (Optional):**  
   You can optionally customize the SSO button text, logo, or colors if your organization prefers a tailored look.

---

## Usage

1. **Login Experience:**  
   Users see a prominent “Sign in with Duo SSO” button on your login page. Clicking this button starts the Duo SSO authentication process.

2. **Authentication:**  
   After successfully authenticating with Duo SSO, users are redirected back to your ERPNext site and logged in automatically.

3. **SSO-Only Mode:**  
   If "Disable Normal Login" is enabled, classic ERPNext login fields and “Forgot Password?” links are hidden for a seamless SSO experience.

---

## Support & Documentation

- **Duo SSO Documentation:** [https://duo.com/docs/sso](https://duo.com/docs/sso)
- **Frappe/ERPNext Docs:** [https://frappe.io/docs](https://frappe.io/docs)
- **GitHub Repository:** [https://github.com/ahmedemamhatem/duo_sso_integration](https://github.com/ahmedemamhatem/duo_sso_integration)

---

## License

This project is licensed under the [MIT License](license.txt).

---

## Acknowledgements

- **Cisco Duo** and logo are trademarks of Cisco.
- Built for the [Frappe](https://frappe.io/) / [ERPNext](https://erpnext.com/) open-source ecosystem.

---
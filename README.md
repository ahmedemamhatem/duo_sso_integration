# Duo SSO Integration for Frappe/ERPNext

This app enables seamless Cisco Duo Single Sign-On (SSO) for your Frappe or ERPNext site, providing a secure, modern, and branded authentication experience. The login page features the official Duo logo, animated SSO button, and responsive design. All branding is inline, so your login always looks professional.

---

## Features

- **Cisco Duo SSO login:** Users authenticate through your organization's existing Duo SSO.
- **Duo-branded experience:** Official Duo logo and color scheme on the login page.
- **Animated, accessible SSO button:** Modern look with smooth transitions.
- **Mobile-friendly:** Responsive design for all devices.
- **Configurable:** Optionally hides standard ERPNext login fields and "Forgot Password?" links for SSO-only environments.

---

## Usage

1. **Install the app** on your Frappe/ERPNext site using Bench.
2. **Configure your Duo SSO credentials** in the app’s settings or site config.
3. **(Optional) Enable SSO-only mode:**  
   In the app settings, set “Disable Normal Login” to `1` to hide username/password and use only SSO.
4. **Login experience:**  
   Users will see a prominent “Sign in with Duo SSO” button on your login page. Clicking it starts the Duo SSO process.
5. **Authentication:**  
   After successfully authenticating with Duo SSO, users are redirected back and logged into ERPNext.

---

## Support & Documentation

- For Cisco Duo SSO documentation, see: [https://duo.com/docs/sso](https://duo.com/docs/sso)
- For Frappe/ERPNext help, visit: [https://frappe.io/docs](https://frappe.io/docs)

---

## License

MIT License (or as per your organization’s policy).

---

## Acknowledgements

- Cisco Duo and logo are trademarks of Cisco.
- Built for the Frappe/ERPNext open source ecosystem.
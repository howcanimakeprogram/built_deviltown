# Security and API Management

## Secret Management
1. **No Hardcoded Secrets**: API keys, tokens, and passwords must never be in the source code.
2. **Secure Sources**: Use `.env`, OS Keychain, Secret Managers, or encrypted files.
3. **Credential Encryption**: Encrypt stored credentials (e.g., Fernet) and manage keys separately.

## Access Control
1. **Least Privilege**: Grant minimum necessary scopes for API and file access.

## Pre-deployment Security Checklist
Run this 10-second check before any deployment or code sharing:
- [ ] No hardcoded API keys/tokens?
- [ ] No PII in logs?
- [ ] Minimum privilege principle applied?
- [ ] Credential files encrypted?
- [ ] No internal system info in error messages?
- [ ] Debug mode disabled?
- [ ] Test accounts/URLs removed?
- [ ] Verified via `git diff` for sensitive info?

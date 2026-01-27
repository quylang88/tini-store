## 2025-01-27 - Hardcoded Credentials in Authentication Logic
**Vulnerability:** Found hardcoded username ("tinyshop") and password ("Misa@2024") directly in `src/hooks/auth/useLoginLogic.js`.
**Learning:** Hardcoded credentials in client-side code are easily extractable. Even for internal/prototype apps, this practice creates a bad habit and risks exposure if the code is ever shared or deployed publicly.
**Prevention:** Always use environment variables (`import.meta.env` in Vite) for configuration and secrets, even for simple authentication checks. Ensure `.env` is gitignored.

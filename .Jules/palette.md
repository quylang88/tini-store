## 2026-01-25 - Safe Drag Areas in Sheets
**Learning:** Mixing "pull-to-dismiss" and native scrolling on the *same* web element is flaky and error-prone (accidental dismissals).
**Action:** For robust PWA sheets, restrict drag initiation to explicit "safe zones" (Drag Handle, Header/Title) and leave the scrollable content area purely for scrolling. This mimics native behavior safely without complex gesture interception logic.

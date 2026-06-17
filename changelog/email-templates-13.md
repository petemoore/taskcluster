level: patch
audience: users
---
Notification emails once again have their CSS inlined into per-element
`style=` attributes. The `email-templates` v11 upgrade flipped the underlying
juice defaults so stylesheets were left as `<head>` `<style>` tags, which many
email clients (notably Outlook and Gmail) strip or ignore, degrading the
rendering of transactional notification emails. The notifier now explicitly
restores the previous inlining behavior.

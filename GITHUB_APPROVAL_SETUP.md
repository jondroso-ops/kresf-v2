# KRESF — GitHub owner-approval setup

The repository is public, and cloning, reading, downloading, or forking public code cannot be prevented. These controls prevent **unauthorised merges into the live website** rather than preventing visitors from making suggestions.

## Owner-review setup
The file `.github/CODEOWNERS` designates `@jondroso-ops` as owner for the entire repository including the protection rules. When a non-draft pull request targets `main`, GitHub requests the designated code owner's review.

**Important:** CODEOWNERS by itself is NOT an enforcement mechanism. An administrator must enable a main-branch ruleset and turn on required code-owner approval before merging.

1. Open repository **Settings → Rules → Rulesets → New branch ruleset**.
2. Name: `KRESF main owner approval`, status **Active**. Target **default branch/main**.
3. Enable **Require a pull request before merging**; enable **Require approvals** (1) and **Require review from Code Owners**; optionally **Dismiss stale approvals** and **Require conversation resolution**.
4. Select required status checks `smoke` and `browser` only after they are discoverable from completed workflows. Do not require screenshot-upload jobs.
5. Disable force pushes and branch deletion and avoid bypass permissions except essential recovery administrators. Review permitted collaborators and installed GitHub Apps.
6. On your GitHub account, open **Settings → Notifications**. Enable **Email** and/or **Mobile** notification delivery for review requests and subscribed repository activity. In repository **Watch → Custom**, select **Pull requests** and **Security alerts** as appropriate.
7. For each PR, inspect the **Files changed** tab. Choose **Approve** only for accepted changes, or **Request changes** for rejection/remediation. Do not merge until requirements pass.

**Limitation:** GitHub's built-in approval isn't a custom approve/deny messaging service, and an account owner with administrator/bypass authority may still be able to change settings. Strong authentication, least privilege and audited owner access remain necessary. Anyone can propose changes through a fork/PR, but they do not get write access just by opening one.

For heightened prevention of accidental owner self-merges, require approval from an independent trusted reviewer with write access. GitHub may not count a user's own approval of their own PR; test this before requiring owner-only review. Do not lock yourself out without a recovery plan.

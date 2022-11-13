# Get Approval based on GitHub issue comments

## Usage

```yaml
name: Get Some Feedback based on issue comments
on:
  issue_comment:
    types:
      - created
permissions:
  contents: read
  issues: read

jobs:
  get-approval:
    runs-on: ubuntu-latest
    steps:
      - name: Get Approval
        id: approval
        uses: kharkevich/issue-ops-approval@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          mode: list
          approvers: github_username
      - name: Run if approved
        if: steps.approval.outputs.approved == 'true'
        run: echo "Approved!"
      - name: Run if not approved
        if: steps.approval.outputs.approved == 'false'
        run: echo "Not approved!"
      - name: Run if undefined
        if: steps.approval.outputs.approved == 'undefined'
        run: echo "Undefined!"
```
- `repo-token` is a token with `contents` and `issues` permissions
- `mode` is a mode how to determine approvers, can be `list` (to get approvers list from the input) or `team` (to get approvers list from the GitHub team)
- `minimum-approvals` is an integer that sets the minimum number of approvals required to progress the workflow. Defaults 1 approvers
- `fail-on-decline` if it is set to `true` the workflow will fail if there is a decline. Defaults `false`.
- `approve-words` words that will be used to approve the workflow. See default list in [action.yml](action.yml)
- `decline-words` words that will be used to decline the workflow. See default list in [action.yml](action.yml)

- `approvers` is a comma-delimited list of all required approvers. An approver can either be a user or an org team

## Org team approver

If you want to have `approvers` set to an org team, then you can't use regular `GITHUB_TOKEN` due to the absent of necessary permissions. [GitHub Actions automatic token](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
In this case, you need to generate a token from a GitHub App with the correct set of permissions.

Create a GitHub App with **read-only access to organization members**. Once the app is created, add a repo secret with the app ID. In the GitHub App settings, generate a private key and add that as a secret in the repo as well. You can get the app token by using the [`tibdex/github-app-token`](https://github.com/tibdex/github-app-token) GitHub Action:

```yaml
name: Get Some Feedback based on issue comments
on:
  issue_comment:
    types:
      - created
permissions:
  contents: read
  issues: read
jobs:
  somejob:
    runs-on: ubuntu-latest
    steps:
      - name: Generate token
        id: generate_token
        uses: tibdex/github-app-token@v1
        with:
          app_id: ${{ secrets.APP_ID }}
          private_key: ${{ secrets.APP_PRIVATE_KEY }}
      - name: Get Approval
        id: approval
        uses: kharkevich/issue-ops-approval@v1
        with:
          repo-token: ${{ steps.generate_token.outputs.token }}
          mode: team
          approvers: github_team
      - name: Run if approved
        if: steps.approval.outputs.approved == 'true'
        run: echo "Approved!"
      - name: Run if not approved
        if: steps.approval.outputs.approved == 'false'
        run: echo "Not approved!"
      - name: Run if undefined
        if: steps.approval.outputs.approved == 'undefined'
        run: echo "Undefined!"
```
## License
Apache License 2.0. See [LICENSE](LICENSE) for more information.

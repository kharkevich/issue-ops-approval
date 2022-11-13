const core = require('@actions/core')
const github = require('@actions/github')

// function to get issue comments
async function getIssueComments (octokit, owner, repo, issueNumber) {
  const response = await octokit.request('GET /repos/{owner}/{repo}/issues/{issueNumber}/comments{?since,per_page,page}', {
    owner,
    repo,
    issueNumber
  })
  return response.data
}

// function to get team members
async function getTeamMembers (octokit, org, teamSlug) {
  const response = await octokit.request('GET /orgs/{org}/teams/{teamSlug}/members', {
    org,
    teamSlug
  })
  return response.data
}

async function main () {
  try {
    const octokit = github.getOctokit(core.getInput('repo-token'))
    const mode = core.getInput('mode')
    let teamMembers
    if (mode === 'team') {
      teamMembers = await getTeamMembers(octokit, github.context.repo.owner, core.getInput('approvers'))
      core.info(JSON.stringify(teamMembers, undefined, 2))
    } else {
      teamMembers = core.getInput('approvers').split(',').map((x) => x.trim())
    }
    const issueNumber = github.context.payload.issue.number
    core.info(`The issue number is: ${issueNumber}`)
    core.info(`The repo is: ${github.context.repo.repo}`)
    core.info(`The owner is: ${github.context.repo.owner}`)
    const declineWords = core.getInput('decline-words').split(',').map(word => word.trim())
    const approveWords = core.getInput('approve-words').split(',').map(word => word.trim())
    core.info(`Decline words: ${declineWords}`)
    core.info(`Approve words: ${approveWords}`)

    const comments = await getIssueComments(octokit, github.context.repo.owner, github.context.repo.repo, issueNumber)
    core.info(Array.isArray(comments))
    comments.sort((a, b) => b.id - a.id)
    const approvals = []
    for (const comment of comments) {
      if (declineWords.some(word => comment.body.includes(word))) {
        core.setOutput('approved', false)
        core.setOutput('justification', 'Issue was declined')
        core.info('Issue was declined')
        if (core.getBooleanInput('fail-on-decline')) {
          core.setFailed('The action has been declined')
        }
        return
      }
      if (approveWords.some(word => comment.body.includes(word))) {
        teamMembers.forEach(member => {
          if (comment.user.login === member && !approvals.includes(member)) {
            approvals.push(member)
            core.info(`The approvals are: ${approvals}`)
          }
        })
      }
      if (approvals.length >= core.getInput('minimum-approvals')) {
        core.setOutput('approved', true)
        core.setOutput('justification', 'Issue was approved')
        core.info('Issue was approved')
        return
      }
    }
    if (approvals.length < core.getInput('minimum-approvals')) {
      core.setOutput('approved', 'undefined')
      core.setOutput('justification', 'Count of approvals is less than minimum approvals')
      core.info('Count of approvals is less than minimum approvals')
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()

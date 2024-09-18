import { execSync } from 'node:child_process'

export interface GitInfo {
	commitHash: string | null
	branchName: string | null
	tagVersion: string | null
	isDirty: boolean
}

const runGit = (cmd: string) => {
	try {
		return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim()
	} catch {
		return null
	}
}

export const getGitinfo = () => {
	const commitHash = runGit('rev-parse HEAD')
	const branchName = runGit('rev-parse --abbrev-ref HEAD')
	const tagVersion = runGit('describe --tags --abbrev=0')
	const isDirty = runGit('status --porcelain') !== ''

	return { commitHash, branchName, tagVersion, isDirty } as GitInfo
}

export const parseGitInfo = (info: GitInfo) => {
	const hash = info.commitHash ? info.commitHash.substring(0, 8) : 'N/A'
	const branch = info.branchName ?? 'N/A'
	const tag = info.tagVersion ?? 'N/A'
	const dirty = info.isDirty ? '-dirty' : ''

	if (process.env['DEBUG'] == 'true') {
		return `${hash}-${branch}${dirty} (Development)`
	} else {
		return `${tag} (${hash}-${branch})`
	}
}

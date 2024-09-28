import { execSync } from 'node:child_process'
import { cliArgs } from './config'

const versionNumber = '2.0.0'

export interface GitInfo {
	commitHash: string | null
	branchName: string | null
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

const getGitinfo = () => {
	const commitHash = runGit('rev-parse HEAD')
	const branchName = runGit('rev-parse --abbrev-ref HEAD')
	const isDirty = runGit('status --porcelain') !== ''

	return { commitHash, branchName, isDirty } as GitInfo
}

const parseGitInfo = () => {
	const info = getGitinfo()

	const hash = info.commitHash ? info.commitHash.substring(0, 8) : 'N/A'
	const branch = info.branchName ?? 'N/A'
	const dirty = info.isDirty ? '-dirty' : ''

	return `${hash}-${branch}${dirty} (Development)`
}

export const versionInfo = () => {
	return cliArgs.dev ? parseGitInfo() : versionNumber
}

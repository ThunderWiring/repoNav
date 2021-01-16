/**
 * Fetches the content of the repo using Github REST API
 */

const repoBranches = [] /* caches the branches */
let currentBranch = ''
let currentUser = ''
let currentRepo = ''

const isIterable = (value) => Symbol.iterator in Object(value)


const _getRepoBranches = (url) => {
    const { user, repo } = _getRepo(url)
    const req = `https://api.github.com/repos/${user}/${repo}/branches`
    if (repoBranches.length > 0) {
        return Promise.resolve(repoBranches)
    }
    return fetch(req, { method: 'get' })
        .then(res => res.json())
        .then(resp1 => isIterable(resp1) ? resp1 : [resp1])
        .then(res => {
            res.map(b => {
                repoBranches.push(b.name)
            })
            return repoBranches
        })
        .catch(_e => ['master'])
}

const _getBranch = (url) => {
    return _getRepoBranches(url).then(branches => {
        let branchRes = branches[0]
        let ind
        branches.forEach(br => {
            const i = url.indexOf(br)
            ind = url.indexOf(branchRes)
            if (i >= 0 && ind < 0) {
                branchRes = br
            } else {
                branchRes = i >= 0 && i < ind ? br : branchRes
            }
        })
        return branchRes
    }).catch(_e => 'master')
}

const _getContentURL = async (url, path) => {
    return _getBranch(url).then(branch => {
        const { user, repo } = _getRepo(url)
        currentBranch = branch
        currentRepo = repo
        currentUser = user

        if (user == null || user.length === 0 ||
            repo == null || repo.length === 0) {
            return null
        }
        return `https://api.github.com/repos/${user}/${repo}/contents/${path}?ref=${branch}`
    })
}

const _getRepo = (url) => {
    const split = url.split('/')
    if (split.length < 5) {
        return { user: '', repo: '' }
    }
    const user = split[3]
    const repo = split[4]
    return { user, repo }
}

const getTopLevelFiles = async (url) => {
    return _getContentURL(url, '')
        .then((rootContnet) => {
            console.log('getTopLevelFiles - rootContnet', rootContnet)
            if (rootContnet == null) {
                return null
            }
            return fetch(rootContnet, { method: 'get' })
                .then(res => res.json())
                .then(resp1 => isIterable(resp1) ? resp1 : [resp1])
                .catch(err => {
                    console.error('failed to get files for path', dirPath,
                        '\nerror - ', err)
                    return []
                })
        })
}

const getDirFiles = (url, dirPath) => {
    return _getContentURL(url, dirPath).then((contentPath) => {
        console.log('getDirFiles - contentPath', contentPath)
        if (contentPath == null) {
            return null
        }
        return fetch(contentPath, { method: 'get' })
            .then(res => res.json())
            .then(res => {
                return isIterable(res) ? res : [res]
            })
            .catch(e => {
                console.error('getDirFiles - failed to get files for path', dirPath)
                console.error('getDirFiles - err', e)
                return []
            })
    })
}

const didRepoChanged = (url) => {
    return _getBranch(url).then(branch => {
        const { user, repo } = _getRepo(url)
        return currentBranch !== branch || currentRepo !== repo || currentUser !== user
    })
}

export { getTopLevelFiles, getDirFiles, didRepoChanged }

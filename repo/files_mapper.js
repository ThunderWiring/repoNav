/**
 * Fetches the content of the repo using Github REST API
 */

let USER = null
let REPO = null

const _getContentURL = (user, repo, path) => {
    return `https://api.github.com/repos/${user}/${repo}/contents/${path}`
}

const _getRepo = (url) => {
    const split = url.split('/')
    if (split.length < 5) {
        return {user: '', repo: ''}
    }
    const user = split[3]
    const repo = split[4]
    return { user, repo }
}

const getTopLevelFiles = async (url) => {
    const { user, repo } = _getRepo(url)
    USER = user
    REPO = repo

    if ((user == null || repo == null) || user.length === 0 || repo.length === 0) {
        return null
    }

    const rootContnet = _getContentURL(user, repo, '/')
    const isIterable = (value) => Symbol.iterator in Object(value)
    return fetch(rootContnet, { method: 'get' })
        .then(res => res.json())
        .then(resp1 => isIterable(resp1) ? resp1 : [resp1])
        .catch(err => {
            console.error('failed to get files for path', dirPath,
                '\nerror - ', err)
            return []
        })
}

const getDirFiles = (dirPath) => {
    const contentPath = _getContentURL(USER, REPO, dirPath)
    return fetch(contentPath, { method: 'get' })
        .then(res => res.json())
        .then(res => {
            return Symbol.iterator in Object(res) ? res : [res]
        })
        .catch(e => {
            console.error('getDirFiles - failed to get files for path', dirPath)
            console.error('getDirFiles - err', e)
            return []
        })
}

export { getTopLevelFiles, getDirFiles }

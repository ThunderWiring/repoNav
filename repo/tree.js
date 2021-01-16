/**
 * Renders and the filesystem tree in the side navigator and controls the heirarchy
*/

import { getDirFiles } from './files_mapper.js'
import { makeTabActive } from './tabs.js'

const TREE_ID = 'repoTreeRoot'
const REPO_PJAX_CONTAINER_ID = 'js-repo-pjax-container'
let dir_map = {"" : []} // maps the path to the dir object
let dir_html_to_obj_map = []
let fetched_dirs = [] // contains the sha1 of the dirs that their content has been fetched
const treeRoot = document.createElement('ul')
let activeFile = null;

treeRoot.id = TREE_ID

const _toggleLoader = (shouldToggle) => {
    const loader = document.getElementById('repoTreeLoader')
    const isLoading = !loader.classList.contains('loader_invisible')

    if ((shouldToggle ^ isLoading) === 1) {
        loader.classList.toggle('loader_invisible')
    }
    
}

const _updateActiveFile = (loadedFile) => {
    loadedFile.classList.toggle('active_file')
        if (activeFile != null) {
            activeFile.classList.toggle('active_file')
        }
        activeFile = loadedFile
}

const loadFile = (newFileUrl, fileName, fileId) => {
    const req = new XMLHttpRequest();
    _toggleLoader(true)
    req.addEventListener("load", (res) => {
        window.history.pushState("", "", newFileUrl) // change tab url without redirecting
        const dom = document.implementation.createHTMLDocument()
        dom.write(res.currentTarget.responseText)
        dom.close()

        const newContainer = dom.getElementById(REPO_PJAX_CONTAINER_ID)
        if (newContainer == null) {
            console.error('failed to fetch new code container')
            return
        }
        const oldContainer = document.getElementById(REPO_PJAX_CONTAINER_ID)
        oldContainer.replaceWith(newContainer)

        makeTabActive({
            id: `tab_id_${fileId}`,
            fileName: fileName,
            fileUrl: newFileUrl,
        })

        const loadedFile = document.getElementById(fileId)
        _updateActiveFile(loadedFile)

        _toggleLoader(false)
    });
    req.open("GET", newFileUrl);
    req.send()
}

const _onFileClick = (event) => {
    const newFileUrl = event.target.getAttribute('html_url')
    const fileName = event.target.getAttribute('fileName')
    const fileId = event.target.id
    loadFile(newFileUrl, fileName, fileId)

}

const _createFile = (fileObj) => {
    const file = document.createElement('li')
    file.textContent = fileObj.name
    file.id = fileObj.path
    file.setAttribute('html_url', fileObj.html_url)
    file.setAttribute('fileName', fileObj.name)
    file.classList.add('file')
    file.onclick = _onFileClick
    return ({
        ...fileObj,
        ext_html_ele: file
    })
}

const _getSubDirFiles = async (url, dirPath) => {
    return getDirFiles(url, dirPath)
        .then(dirContent => {
            let objToAdd
            return dirContent.map(fileOrDir => {
                if (fileOrDir.type === 'dir') {
                    objToAdd = _createDir(fileOrDir)
                    dir_html_to_obj_map[fileOrDir.path] = objToAdd
                } else {
                    objToAdd = _createFile(fileOrDir)
                }
                return objToAdd
            })
        })
        .catch(e => console.error(
            'failed to get sub-dir files and content for dirPath ', dirPath,
            '\nerror - ', e))
}

const _collapseActiveListsRecursive = (activeElements) => {
    while (activeElements.length > 0) {
        const active = activeElements[0]
        const activeNested = active.getElementsByClassName('nested active')
        if (activeNested.length === 0) {
            active.classList.toggle('active')
            const carets =
                active.parentElement.getElementsByClassName('caret-down')
            while (carets.length > 0) {
                carets[0].classList.toggle('caret-down')
            }
        } else {
            _collapseActiveListsRecursive(activeNested)
        }
    }
}

const _collapseAllChildren = (dir) => {
    const activeElements = dir.getElementsByClassName('nested active')
    _collapseActiveListsRecursive(activeElements)
}

const _clickDir = (clicked) => {
    clicked.parentElement.querySelector(".nested").classList.toggle("active");
    clicked.classList.toggle("caret-down");

    const dirObj = dir_html_to_obj_map[clicked.parentNode.id]
    const shouldFetchFiles =
        clicked.classList.contains('caret-down')
        && fetched_dirs.filter(path => path === dirObj.path).length == 0

    if (!shouldFetchFiles) {
        return
    }

    fetched_dirs.push(dirObj.path)
    const list = clicked.parentNode.getElementsByClassName('nested')
    if (list == null || list.length == 0) {
        console.warn('trying to add items to an invalid parent node')
        return
    }
    const url = window.location.href
    _getSubDirFiles(dirObj.html_url, dirObj.path)
        .then(itemsToAdd => {
            // create dir
            const dirs = itemsToAdd
                .filter(obj => obj.type === 'dir')
                .map(dir => {
                    const dirObj = _createDir(dir)
                    dir_html_to_obj_map[dirObj.path] = dirObj
                    return dirObj
                })
                const files = []
                itemsToAdd.forEach((obj) => {
                    if (obj.type !== 'file') {
                        return
                    }
                    const fileObj = _createFile(obj)
                    files.push(fileObj)
                    const seg = url.split(obj.name)
                    if (seg.length === 2 && seg[1].length === 0) {
                        makeTabActive({
                            id: `tab_id_${obj.path}`,
                            fileName: obj.name,
                            fileUrl:  obj.html_url
                        })
                        _updateActiveFile(fileObj.ext_html_ele)
                    }
                })

            // append it to parent
            const toAppend = [...dirs, ...files].map(x => x.ext_html_ele)
            for (let i = 0; i < toAppend.length; i++) {
                list[0].appendChild(toAppend[i])
            }
        })
        .catch(e => console.error('failed to append dir contents to tree node', e))
}

const _onDirClicked = (event) => {
    const clicked = event.target
    _clickDir(clicked)

    if (!clicked.classList.contains('caret-down')) {
        _collapseAllChildren(clicked.parentElement)
    }
}

/**
 * Creates a new directory element
*/
const _createDir = (dirObj) => {
    const dir = document.createElement('li')
    dir.id = dirObj.path
    const sp = document.createElement('span')

    sp.classList.add('caret')
    sp.textContent = dirObj.name
    sp.onclick = _onDirClicked

    const list = document.createElement('ul')
    list.classList.add('nested')

    dir.appendChild(sp)
    dir.appendChild(list)

    return ({
        ...dirObj,
        ext_html_ele: dir
    })
}

const _toggleActiveRout = (url) => {
    let activeRoute = url.split('github.com/')[1].split('/')
    let startInd = 0

    /**
     * a url could go like this:
     * https://github.com/{user}/{repo}/blob/master/...
     * The 'blob', and 'master' are not directories, and need to be ignored.
     * The first dir in the path (the one right after 'master') must be in 
     * dir_html_to_obj_map obj.
     */
    for (; startInd < activeRoute.length; startInd++) {
        if (dir_html_to_obj_map[activeRoute[startInd]] != null) {
            break
        }
    }

    const pathSegmentation =
        url.split('github.com/')[1].split(`${activeRoute[startInd - 1]}/`)
    if (pathSegmentation.length <= 1) {
        for (let i = 0; i < treeRoot.children.length; i++) {
            const child = treeRoot.children[i]
            const fileName = child.getAttribute('filename')
            const pathSegs = pathSegmentation[0].split('/')
            const nameFromPath = pathSegs[pathSegs.length - 1]
            if (fileName === nameFromPath) {
                _updateActiveFile(child)
                makeTabActive({
                    id: `tab_id_${child.id}`,
                    fileName: fileName,
                    fileUrl: child.getAttribute('html_url'),
                })
                break
            }
        }
        return
    }

    const fullPath = pathSegmentation[1]
    activeRoute = fullPath.split('/')

    for (let i = 0; i < activeRoute.length - 1; i++) {
        const dir = dir_html_to_obj_map[activeRoute[i]]
        if (dir == null) {
            const basePath = fullPath.split(activeRoute[i])[0]
            const path =
                basePath.length == 0
                    ? activeRoute[i] : `${basePath}${activeRoute[i]}`

            _getSubDirFiles(url, path).then(_dirObjs => {
                const toggle =
                    dir_html_to_obj_map[path]
                        .ext_html_ele
                        .getElementsByClassName('caret')[0]
                _clickDir(toggle)
            })
        } else {
            _clickDir(dir.ext_html_ele.getElementsByClassName('caret')[0])
        }
    }
}

const getTree = (url, filesTree) => {
    if (filesTree == null || filesTree.length === 0) {
        console.warn('empty files tree been passed')
        return treeRoot
    }
    const dirs = filesTree
        .filter(obj => obj.type === 'dir')
        .map(dir => {
            const dirObj = _createDir(dir)
            dir_html_to_obj_map[dirObj.path] = dirObj
            return dirObj
        })

    dirs.forEach(dirObj => {
        const arr = dir_map[dirObj.path.split(dirObj.name)[0]]
        if (arr == null) {
            dir_map[dirObj.path.split(dirObj.name)[0]] = [dirObj]
        } else {
            dir_map[dirObj.path.split(dirObj.name)[0]].push(dirObj)
        }
    });

    const files = filesTree
        .filter(obj => obj.type === 'file')
        .map(f => _createFile(f))

    const appendToTree = [...dirs]
    files.forEach(file => {
        const dirPath = file.path.split(file.name)[0]
        if (dir_map[dirPath] != null) {
            appendToTree.push(file)
        }
    })

    for (let i = 0; i < appendToTree.length; i++) {
        treeRoot.appendChild(appendToTree[i].ext_html_ele)
    }

    _toggleActiveRout(url)

    return treeRoot
}

const clearTree = () => {
    // clear tree root
    while(treeRoot.children.length > 0) {
        treeRoot.removeChild(treeRoot.children[0])
    }
    activeFile = null
    dir_map = {"" : []}
    dir_html_to_obj_map = []
    fetched_dirs = []
}

export { TREE_ID, getTree, loadFile, clearTree }

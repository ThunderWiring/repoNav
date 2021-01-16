import { getTopLevelFiles } from './repo/files_mapper.js'
import { getTree, clearTree } from './repo/tree.js'

const EXT_ID = 'E45rt66t'

const _addRepoNavigator = (url, body, files) => {
    const treeNav = _getProjectNavigator(url, files)
    if (treeNav == null) {
        return
    }
    for (let i = 0; i < body.children.length; i++) {
        if (body.children[i].id === EXT_ID) {
            continue
        }
        body.children[i].classList.add('slide')
    }
    body.appendChild(treeNav)
}

const _getLoader = () => {
    const loader = document.createElement('div')
    loader.classList.add('loader')
    loader.classList.add('loader_invisible')
    loader.id = 'repoTreeLoader'
    return loader
}

const _getProjectNavigator = (url, filesTree) => {
    const tree = getTree(url, filesTree)
    if (tree == null) {
        return null
    }

    let sideNav = document.getElementById(EXT_ID)
    if (sideNav != null && sideNav.parentElement != null) {
        sideNav.parentElement.removeChild(sideNav)
    }
    sideNav = document.createElement('nav')
    sideNav.id = EXT_ID
    sideNav.classList.add('sidenav')
    sideNav.appendChild(_getLoader())
    sideNav.appendChild(tree)

    return sideNav
}

const _loadExtention = (body, url) => {
    getTopLevelFiles(url).then(res => {
        if (res != null && res.length > 0) {
            clearTree()
            _addRepoNavigator(url, body, res)
        }
    })
}

/**************************************************************************
 *                  Execution starts here
***************************************************************************/

let url = window.location.href

window.addEventListener('message', (msg) => {
    const newUrl = msg.data.url
    if (newUrl === url) {
        return
    }
    _loadExtention(bodyCollection[0], newUrl)
    url = newUrl
});

const bodyCollection = document.getElementsByTagName('body')

if (bodyCollection.legth == 0) {
    console.warn('current host has no repo to navigate')
} else {
    _loadExtention(bodyCollection[0], url)
}

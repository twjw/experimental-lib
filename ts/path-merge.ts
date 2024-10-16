import path from 'node:path'

const SL = path.normalize('/')

const dirList = [
  path.resolve('a'),
  path.resolve('b'),
  path.resolve('c'),
  path.resolve('d'),
]

const aFilepathList = [
  path.resolve('a/page.tsx'),
  path.resolve('a/hello/page.tsx'),
  path.resolve('a/hello/world/page.tsx'),
]

const bFilepathList = [
  path.resolve('b/page.tsx'),
  path.resolve('b/apple/page.tsx'),
  path.resolve('b/hello/world/page.tsx'),
]

const cFilepathList = [
  path.resolve('c/page.tsx'),
]

const dFilepathList: string[] = []

const dirFilepathList = [
  aFilepathList,
  bFilepathList,
  cFilepathList,
  dFilepathList,
]

const filepathDirIndexMap = createFilepathDirIndexMap(dirList, dirFilepathList)

/**
 * @desc 遞迴取出檔案絕對路徑列表
 */
function deepLoopGetFilepathList () {

}

/**
 * @desc 創建檔案目錄索引Map，接收的值的路徑都是絕對路徑
 */
function createFilepathDirIndexMap (dirList: string[], dirFilepathList: string[][]) {
  const filepathDirIndexMap = new Map<string, number /* dirIndex */>()

  for (let i = 0; i < dirList.length; i++) {
    const dir = dirList[i]
    const filePathList = dirFilepathList[i]
    for (let j = 0; j < filePathList.length; j++) {
      const relativeFilepath = filePathList[j].substring(dir.length)
      if (filepathDirIndexMap.has(relativeFilepath)) continue
      let isMatch = false
      for (let k = dirList.length - 1; k > i; k--) {
        if (dirFilepathList[k].includes(path.resolve(dirList[k], relativeFilepath.substring(1)))) {
          filepathDirIndexMap.set(relativeFilepath, k)
          isMatch = true
          break
        }
      }
      if (!isMatch) {
        filepathDirIndexMap.set(relativeFilepath, i)
      }
    }
  }

  return filepathDirIndexMap
}

/**
 * @desc 匹配檔案路徑，傳入的需為絕對路徑
 */
function matchFilepath (filepath: string) {
  for (let i = dirList.length - 1; i >= 0; i--) {
    const dir = dirList[i]

    // 檢查是不是目錄
    if (filepath[dir.length] !== SL) {
      continue
    }

    const fileDirPath = filepath.substring(0, dir.length)
    // 檢查目錄是否匹配
    if (fileDirPath !== dir) {
      continue
    }

    const relativeFilepath = filepath.substring(dir.length)
    const filepathDirIndex = filepathDirIndexMap.get(relativeFilepath)
    if (filepathDirIndex != null) {
      if (i < filepathDirIndex) {
        // 已匹配到權重較小
        console.log(relativeFilepath, 'LOW', i, '<', filepathDirIndex)
      } else {
        if (i > filepathDirIndex) {
          // 已匹配但權重較大
          console.log(relativeFilepath, 'UPPER', filepathDirIndex, '->', i)
          filepathDirIndexMap.set(relativeFilepath, i)
        } else {
          // 完整匹配
          console.log(relativeFilepath, 'FULL_MATCH', i)
        }
      }
      break
    } else {
      // 匹配到目錄但沒匹配到檔案
      console.log(relativeFilepath, 'MATCH_DIR_BUT_NOT_MATCH_FILE', i)
      filepathDirIndexMap.set(relativeFilepath, i)
      break
    }
  }
}

const changeFilepath1 = path.resolve('c/page.tsx')
const changeFilepath2 = path.resolve('a/hello/page.tsx')
const changeFilepath3 = path.resolve('a/not-found/page.tsx')
const changeFilepath4 = path.resolve('c/not-found/page.tsx')
const changeFilepath5 = path.resolve('b/not-found/page.tsx')
const changeFilepath6 = path.resolve('d/not-found/page.tsx')
const changeFilepath7 = path.resolve('cc/page.tsx')
const changeFilepath8 = path.resolve('b/page.tsx')
const changeFilepath9 = path.resolve('b/hello/page.tsx')
console.log(filepathDirIndexMap)
matchFilepath(changeFilepath1)
matchFilepath(changeFilepath2)
matchFilepath(changeFilepath3)
matchFilepath(changeFilepath4)
matchFilepath(changeFilepath5)
matchFilepath(changeFilepath6)
matchFilepath(changeFilepath7)
matchFilepath(changeFilepath8)
matchFilepath(changeFilepath9)
console.log(filepathDirIndexMap)

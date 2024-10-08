const pathList = [
  'user/del',
  'user/login',
  'user/:id',
  'user/:id/update',
  'user/:id/update/:name',
  'user/:id/add/:name',
  'hello/world',
  'hello/world/apple',
  'hello/:what',
  'hello/:name',
  'yes',
]

const SPEC = '<<SPEC>>'
const SPEC_PARAM = '<<SPEC_PARAM>>'
const eg: PathCombineObj = {
  user: [true, {
    del: [true],
    login: [true],
    [SPEC_PARAM]: [true, {
      update: [true, {
        [SPEC_PARAM]: [true, undefined, 'name'],
      }],
      add: [false, {
        [SPEC_PARAM]: [true, undefined, 'name'],
      }]
    }, 'id']
  }],
  hello: [true, {
    world: [true, {
      apple: [true],
    }],
    [SPEC_PARAM]: [true, undefined, 'name'],
  }],
  yes: [true],
}

type PathCombineObj = {
  [k: string]: [boolean] | [boolean, PathCombineObj] | [boolean, PathCombineObj, string]
}
const pathCombineObj: PathCombineObj = {}

for (let i = 0; i < pathList.length; i++) {
  const words = pathList[i].split('/')
  if (!words.length) continue
  let next: PathCombineObj = pathCombineObj
  for (let j = 0; j < words.length; j++) {
    const word = words[j]
    if (word[0] === ':') {
      if (j === words.length - 1) {}
    } else if (next[word]) {
      if (j === words.length - 1) {}
    } else {
      if (j === words.length - 1) {}
    }
  }
}

console.log(JSON.stringify(pathCombineObj, null, 2))

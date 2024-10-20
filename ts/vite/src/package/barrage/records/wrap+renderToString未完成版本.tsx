import {createRoot, Root} from 'react-dom/client'
import {createElement, memo, useLayoutEffect, useMemo, useRef, useState} from "react";
import {renderToString} from "react-dom/server";
import clsx from "clsx";

createRoot(document.getElementById('root')!).render(
  <Component />,
)

const BARRAGE_TYPE_NOBLE = 1 // 貴族
const BARRAGE_TYPE_BET_WIN = 2 // 投注中獎
const BARRAGE_TYPE_STEED = 3 // 坐騎
type BarrageTypeNoble = typeof BARRAGE_TYPE_NOBLE
type BarrageTypeBetWin = typeof BARRAGE_TYPE_BET_WIN
type BarrageTypeSteed = typeof BARRAGE_TYPE_STEED
type BarrageType = BarrageTypeNoble | BarrageTypeBetWin | BarrageTypeSteed

type BarrageNobleData = {}
type BarrageBetWinData = {}
type BarrageSteedData = {}
// prettier-ignore
type BarrageData<T extends BarrageType> =
  T extends BarrageTypeNoble
    ? BarrageNobleData
    : T extends BarrageTypeBetWin
      ? BarrageBetWinData
      : T extends BarrageTypeSteed
        ? BarrageSteedData
        : never

type BarrageItem<T extends BarrageType> = {
  type: T
  data: BarrageData<T>
}

type BarrageDomInfo = {
  dom: HTMLElement
  x: number
  y: number
  width: number
  height: number
}

function Avatar () {
  function handleClick() {
    console.log('avatar')
  }

  return <div className="rounded-full bg-red-500 w-10 h-10 mr-2" onClick={handleClick} />
}

let testId = 0
function Component() {
  useLayoutEffect(() => {
    // 測試資料START
    const testData: BarrageItem<any>[] = new Array(36).fill(undefined).map((_, i) => ({
      type: (i % 3) + 1,
      data: {},
    }))

    const wrap = document.getElementById(BARRAGE_WRAP_ID) as HTMLDivElement
    testData.forEach(e => {
      appendBarrageItem(wrap, e)
    })
    // 測試資料END
  }, [])

  const [testData, setTestData] = useState<{ n: number }[]>([])
  function test () {
    setTestData(e => [...e, { n: ++testId }])
  }

  return <div className={'w-screen h-screen bg-gray-800'}>
    <div id={BARRAGE_WRAP_ID} className={'relative overflow-hidden h-[240px]'} />
    <div>
      <button onClick={test}>test</button>
      {testData.map(e => <MemoTestItem key={e.n} n={e.n} />)}
    </div>
  </div>
}

function TestItem ({ n }: { n: number }) {
  return <div className={'text-white'}>{n} {Math.random()}</div>
}
const MemoTestItem = memo<{ n: number }>(TestItem, (prev, current) => prev.n === current.n)

const BARRAGE_WRAP_ID = 'barrage-wrap'
const BARRAGE_DOM_MSG_GAY_X = 8
const BARRAGE_DOM_MSG_GAY_Y = 8
const barrageDomInfoList: BarrageDomInfo[] = []
const baseBarrageItemDomClassName = 'absolute left-0 top-0'

function appendBarrageItem<T extends BarrageType> (wrapDom: HTMLElement, item: BarrageItem<T>) {
  const info = createBarrageDom(item.type)
  barrageDomInfoList.push(info)
  wrapDom.append(info.dom)
  updateBarrageDomPositionAndSize(wrapDom, info, true)
}

function updateBarrageDomPositionAndSize (wrapDom: HTMLElement, info: BarrageDomInfo, isInit = false) {
  if (isInit) {
    info.x = wrapDom.clientWidth
    info.y = 0
    info.width = info.dom.clientWidth
    info.height = info.dom.clientHeight

    // -2 是因為過濾自己
    for (let i = barrageDomInfoList.length - 2; i >= 0; i--) {
      const prevInfo = barrageDomInfoList[i]
      const bottomY = prevInfo.y + prevInfo.height
      /** @desc 剩餘高度 */
      const overHeight = wrapDom.clientHeight - bottomY
      if (overHeight > info.height) {

      }
      console.log(wrapDom.clientHeight - bottomY)
      break
    }
  }

  info.dom.style.transform = `translate3d(${info.x}px, ${info.y}px, 0)`
}

function createBarrageDom (type: BarrageType) {
  const dom = document.createElement('div')
  const info: BarrageDomInfo = {
    dom,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }

  if (type === BARRAGE_TYPE_NOBLE) {
    dom.className = clsx(baseBarrageItemDomClassName, 'w-fit bg-red-300 rounded-[50px] flex items-center px-2 py-1 text-black')
    dom.innerHTML = renderToString(
      <>
        <div className="rounded-full bg-red-500 w-10 h-10 mr-2" />
        <span>BARRAGE_TYPE_NOBLE(貴族)</span>
      </>
    )
  } else if (type === BARRAGE_TYPE_BET_WIN) {
    dom.className = clsx(baseBarrageItemDomClassName, 'w-fit bg-green-300 rounded-[50px] px-3 py-1 text-[12px] text-black')
    dom.innerHTML = renderToString(
      <>
        BARRAGE_TYPE_NOBLE(投注中獎)
      </>
    )
  } else if (type === BARRAGE_TYPE_STEED) {
    dom.className = clsx(baseBarrageItemDomClassName, 'w-fit bg-yellow-300 rounded-[50px] px-2 py-1 text-black')
    dom.innerHTML = renderToString(
      <>
        BARRAGE_TYPE_NOBLE(坐騎)
      </>
    )
  }

  return info
}

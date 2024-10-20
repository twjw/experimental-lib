import {createRoot} from 'react-dom/client'
import {memo, ReactNode, useEffect, useLayoutEffect, useState} from "react";
import clsx from "clsx";
import {mittEmit, useMittOn} from "./emitter.ts";

createRoot(document.getElementById('root')!).render(
  <Component />,
)

// let testId = 0
function Component() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // 測試資料START
    const testData: BarrageItem<any>[] =
      new Array(36)
        .fill(undefined).map((_, i) => ({
        type: (i % 3) + 1,
        data: {},
      }))

    for (let i = 0; i < testData.length; i++) {
      appendBarrageItem(testData[i])
    }
    // 測試資料END
  }, [])

  // const [testData, setTestData] = useState<{ n: number }[]>([])
  // function test () {
  //   setTestData(e => [...e, { n: ++testId }])
  // }

  return <div id={'aaa'} className={'relative w-screen h-screen overflow-hidden bg-gray-800'}>
    {visible && <BarrageList item={MemoBarrageItem} />}
    <button onClick={() => {
      appendBarrageItem({
        type: Math.floor(randomRange(1, 3.9)) as BarrageType,
        data: {},
      })
    }}>append test</button>
    <button onClick={() => {
      setVisible(e => !e)
    }}>unmount test</button>
    {/*<div>*/}
    {/*  <button onClick={test}>test</button>*/}
    {/*  {testData.map(e => <MemoTestItem key={e.n} n={e.n} />)}*/}
    {/*</div>*/}
  </div>
}

// function TestItem ({ n }: { n: number }) {
//   return <div className={'text-white'}>{n} {Math.random()}</div>
// }
// const MemoTestItem = memo<{ n: number }>(TestItem, (prev, current) => prev.n === current.n)

export const BARRAGE_TYPE_NOBLE = 1 // 貴族
export const BARRAGE_TYPE_BET_WIN = 2 // 投注中獎
export const BARRAGE_TYPE_STEED = 3 // 坐騎
export type BarrageTypeNoble = typeof BARRAGE_TYPE_NOBLE
export type BarrageTypeBetWin = typeof BARRAGE_TYPE_BET_WIN
export type BarrageTypeSteed = typeof BARRAGE_TYPE_STEED
export type BarrageType = BarrageTypeNoble | BarrageTypeBetWin | BarrageTypeSteed

export type BarrageNobleData = {}
export type BarrageBetWinData = {}
export type BarrageSteedData = {}

// prettier-ignore
export type BarrageDataByType<T extends BarrageType> =
  T extends BarrageTypeNoble
    ? BarrageNobleData
    : T extends BarrageTypeBetWin
      ? BarrageBetWinData
      : T extends BarrageTypeSteed
        ? BarrageSteedData
        : never

export type BarrageItem<T extends BarrageType> = {
  type: T
  data: BarrageDataByType<T>
}

type BarragePrivateItem<T extends BarrageType> = BarrageItem<T> &{
  dom: HTMLElement | null // 未初始化是 null
}

export type BarrageInfo = {
  x: number
  y: number
  width: number
  height: number
  rate: number // 移動速率
}

type BarragePrivateItemInfo<T extends BarrageType = any> = BarragePrivateItem<T> & BarrageInfo

export type BarrageAppendMiteType =
  | 'ROOM_BARRAGE_APPEND' // 直播間彈幕組件推訊息

export type BarrageListProps = {
  wrap?: string // 插入元素的 selector
  item: <T extends BarrageType>(props: BarragePrivateItem<T>) => ReactNode
  appendMittType?: BarrageAppendMiteType
  rateMin?: number // 最小速率(兩者數值不同的話功能不完全)
  rateMax?: number // 最大速率(兩者數值不同的話功能不完全)
  offsetY?: number // 插入的初始Y
  offsetHeight?: number // 插入的最大高
}

function randomRange (min: number, max: number) {
  return Math.random() * (max - min) + min
}

const BASE_BARRAGE_ITEM_CLASSNAME = 'absolute left-0 top-0 w-fit'
function BarrageItem <T extends BarrageType>(
  {
    type,
    data,
  }: BarrageItem<T>
) {
  if (type === BARRAGE_TYPE_NOBLE) {
    return (
      <div className="px-4 py-1">
        <div
          className={clsx(BASE_BARRAGE_ITEM_CLASSNAME, 'bg-red-300 rounded-[50px] flex items-center px-2 py-1 text-black')}>
          <Avatar/>
          <span>BARRAGE_TYPE_NOBLE(貴族)<br/>{Math.random()}</span>
        </div>
      </div>
    )
  } else if (type === BARRAGE_TYPE_BET_WIN) {
    return (
      <div className="px-4 py-1">
        <div
          className={clsx(BASE_BARRAGE_ITEM_CLASSNAME, 'bg-green-300 rounded-[50px] px-3 py-1 text-[12px] text-black')}>
          BARRAGE_TYPE_NOBLE(投注中獎)
        </div>
      </div>
    )
  } else if (type === BARRAGE_TYPE_STEED) {
    return (
      <div className="px-4 py-1">
        <div className={clsx(BASE_BARRAGE_ITEM_CLASSNAME, 'bg-yellow-300 rounded-[50px] px-2 py-1 text-black')}>
          BARRAGE_TYPE_NOBLE(坐騎)
        </div>
      </div>
    )
  }

  return <div/>
}

const MemoBarrageItem = memo<BarragePrivateItem<any>>(BarrageItem, (prevProps, currentProps) => prevProps._id === currentProps._id)

function Avatar () {
  function handleClick() {
    console.log('avatar')
  }

  return <div className="rounded-full bg-red-500 w-10 h-10 mr-2" onClick={handleClick} />
}

/**
 * @desc 彈幕列表
 */
export function BarrageList (
  {
    wrap = 'body',
    appendMittType = 'ROOM_BARRAGE_APPEND',
    item: Item,
    rateMin = 2,
    rateMax = rateMin,
    offsetY,
    offsetHeight,
  }: BarrageListProps
) {
  /** @desc 該 state 的數組資料是不安全的，會不斷副作用替換 dom 移動的資訊 */
  const [itemInfoList, setItemInfoList] = useState<BarragePrivateItemInfo[]>([])

  useMittOn(appendMittType, (ev) => {
    setItemInfoList(list => [...list, {
      ...ev,
      dom: null,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rate: rateMin === rateMax ? rateMin : randomRange(rateMin, rateMax),
    }])
  })

  useLayoutEffect(() => {
    const frame = createMoveAllBarrageItemAnimationFrame({
      wrap,
      itemInfoList,
      offsetY,
      offsetHeight,
    })
    requestAnimationFrame(frame.moveAllBarrageItem)
    return frame.unmount
  }, [itemInfoList.length]);

  return null
}

type BarrageMoveParams = {
  wrap: string
  itemInfoList: BarragePrivateItemInfo[]
  offsetY?: number
  offsetHeight?: number
}
function createMoveAllBarrageItemAnimationFrame (
  {
    wrap,
    itemInfoList,
    offsetY = 80,
    offsetHeight = 240,
  }: BarrageMoveParams
) {
  /** @desc 網頁刷新率(現代瀏覽器基本 60，就以 60 表示就好，只是為了做時間差處理用) */
  const FPS = 60
  /** @desc 每秒刷新幾次頁面(與 FPS 連動用) */
  const PER_SECOND_REFRESH_TIMES = 1000 / FPS
  let animateId: number | undefined = undefined
  /** @desc 瀏覽器頁籤消失時間 */
  let hiddenTime = 0
  /** @desc 需要補移動的次數(尚未實作) */
  let callDiff = 0

  document.addEventListener('visibilitychange', handleDocumentVisibleChange)

  function unmount () {
    if (animateId != null) cancelAnimationFrame(animateId)
    document.removeEventListener('visibilitychange', handleDocumentVisibleChange)
    for (let i = 0; i < itemInfoList.length; i++) {
      itemInfoList[i].dom?.remove()
    }
  }

  /** @desc 用來取得離開瀏覽器頁籤多久要多運行幾次未運行的移動代碼 */
  function handleDocumentVisibleChange () {
    if (document.hidden) {
      hiddenTime = Date.now()
    } else {
      callDiff = Math.floor((Date.now() - hiddenTime) / 1000 * PER_SECOND_REFRESH_TIMES)
    }
  }

  function moveAllBarrageItem () {
    // log 別刪，用來檢查是否有洩漏
    console.log('bx00')

    const wrapDom = document.querySelector(wrap)

    if (wrapDom && itemInfoList.length) {
      for (let i = 0; i < itemInfoList.length; i++) {
        const itemInfo = itemInfoList[i]

        if (itemInfo.dom == null) {
          wrapDom.append(itemInfo.dom = createBarrageItemDom(itemInfo.type, itemInfo.data, i))
          itemInfo.x = wrapDom.clientWidth
          itemInfo.y = offsetY
          itemInfo.width = itemInfo.dom.clientWidth
          itemInfo.height = itemInfo.dom.clientHeight

          const prevItemInfo = itemInfoList[i - 1]
          if (prevItemInfo != null) {
            const bottomY = prevItemInfo.y + prevItemInfo.height
            /** @desc 剩餘高度 */
            const overHeight = offsetY + offsetHeight - bottomY

            if (overHeight < itemInfo.height) {
              itemInfo.y = offsetY
            } else {
              itemInfo.y = bottomY
            }

            /** @desc 下 y 匹配的索引 */
            let nextI = -1
            for (let j = i - 1; j >= 0; j--) {
              /** @desc 最終的該值為匹配上 y */
              const prevItemInfo = itemInfoList[j]

              if (prevItemInfo.y + prevItemInfo.height >= itemInfo.y + itemInfo.height) {
                nextI = j
              }

              if (nextI !== -1) {
                if (prevItemInfo.y <= itemInfo.y) {
                  if (nextI === j) {
                    let nextX = prevItemInfo.x + prevItemInfo.width
                    if (nextX > itemInfo.x) {
                      itemInfo.x = nextX
                    }
                  } else {
                    let maxX = itemInfo.x
                    for (let k = j; k <= nextI; k++) {
                      const nextX = itemInfoList[k].x + itemInfoList[k].width
                      if (nextX > maxX) maxX = nextX
                    }
                    itemInfo.x = maxX
                  }

                  break
                }
              } else if (prevItemInfo.y === offsetY && j > 0) {
                nextI = --j
              }
            }
          }
        } else {
          itemInfo.x = itemInfo.x - itemInfo.rate

          if (itemInfo.x + itemInfo.width < 0) {
            itemInfoListRef.current.splice(i--, 1)
            itemInfo.dom.remove()
            continue
          }
        }

        if (itemInfo.x <= wrapDom.clientWidth) {
          itemInfo.dom.style.transform = `translate3d(${itemInfo.x}px, ${itemInfo.y}px, 0)`
        }
      }
    }

    if (callDiff !== 0) callDiff = 0

    animateId = requestAnimationFrame(moveAllBarrageItem)
  }

  return {
    moveAllBarrageItem,
    unmount,
  }
}

function appendBarrageItem<T extends BarrageType> (item: BarrageItem<T>) {
  mittEmit('ROOM_BARRAGE_APPEND', item)
}

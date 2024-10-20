import {createRoot, Root} from 'react-dom/client'
import {
  createElement,
  Dispatch,
  memo,
  ReactNode,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {renderToString} from "react-dom/server";
import clsx from "clsx";
import {mittEmit, useMittOn} from "./emitter.ts";

createRoot(document.getElementById('root')!).render(
  <Component />,
)

// let testId = 0
function Component() {
  useLayoutEffect(() => {
    // 測試資料START
    setTimeout(async () => {
      const testData: BarrageItem<any>[] = new Array(36).fill(undefined).map((_, i) => ({
        type: (i % 3) + 1,
        data: {},
      }))

      for (let i = 0; i < testData.length; i++) {
        await new Promise((resolve) => {
          setTimeout(resolve, 500 )
        })
        appendBarrageItem(testData[i])
      }
    }, 500)
    // 測試資料END
  }, [])

  // const [testData, setTestData] = useState<{ n: number }[]>([])
  // function test () {
  //   setTestData(e => [...e, { n: ++testId }])
  // }

  return <div className={'w-screen h-screen bg-gray-800'}>
    <BarrageList className={'h-[240px]'} item={MemoBarrageItem} />
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
  _id: number // 別刪必要：只為了 memo 用
  _new: boolean // 是否是新的，true 表示要調用初始化功能
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
  className?: string
  appendMittType?: BarrageAppendMiteType
  item: <T extends BarrageType>(props: BarragePrivateItem<T>) => ReactNode
  rateMin?: number
  rateMax?: number
  gapX?: number
  gapY?: number
}

function randomRange (min: number, max: number) {
  return Math.random() * (max - min) + min
}

/**
 * @desc 彈幕列表
 */
export function BarrageList (
  {
    className,
    appendMittType = 'ROOM_BARRAGE_APPEND',
    item: Item,
    rateMin = 1,
    rateMax = 1.2,
    gapX = 32,
    gapY = 8,
  }: BarrageListProps
) {
  /** @desc 該 state 的數組資料是不安全的，會不斷副作用替換 dom 移動的資訊 */
  const [itemInfoList, setItemInfoList] = useState<BarragePrivateItemInfo[]>([])
  const wrapDomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0)

  useMittOn(appendMittType, (ev) => {
    setItemInfoList(list => [...list, {
      ...ev,
      _id: ++idRef.current,
      _new: true,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rate: randomRange(rateMin, rateMax),
    }])
  })

  useEffect(() => {
    if (!itemInfoList.length) return
    const frame = createMoveAllBarrageItemAnimationFrame({
      wrapDom: wrapDomRef.current,
      gapX,
      gapY,
      itemInfoList,
      setItemInfoList,
    })
    requestAnimationFrame(frame.moveAllBarrageItem)
    return frame.unmount
  }, [itemInfoList.length]);

  return <div ref={wrapDomRef} className={clsx('relative overflow-hidden', className)}>
    {itemInfoList.map(e => <Item {...e} key={e._id} />)}
  </div>
}

type BarrageMoveParams = {
  wrapDom?: HTMLElement | null
  gapX: number;
  gapY: number;
  itemInfoList: BarragePrivateItemInfo[]
  setItemInfoList: Dispatch<SetStateAction<BarragePrivateItemInfo[]>>
}
function createMoveAllBarrageItemAnimationFrame (
  {
    wrapDom,
    gapX,
    gapY,
    itemInfoList,
    setItemInfoList,
  }: BarrageMoveParams
) {
  /** @desc 網頁刷新率(現代瀏覽器基本 60，就以 60 表示就好，只是為了做時間差處理用) */
  const FPS = 60
  /** @desc 每秒刷新幾次頁面(與 FPS 連動用) */
  const PER_SECOND_REFRESH_TIMES = 1000 / FPS
  let animateId: number | undefined = undefined
  /** @desc 瀏覽器頁籤消失時間 */
  let hiddenTime = 0
  /** @desc 需要補移動的次數 */
  let callDiff = 0

  document.addEventListener('visibilitychange', handleDocumentVisibleChange)

  function unmount () {
    if (animateId != null) cancelAnimationFrame(animateId)
    document.removeEventListener('visibilitychange', handleDocumentVisibleChange)
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
    // log 別刪，用來檢查是否有正確釋放動畫
    console.log('bx00')

    if (wrapDom) {
      /** @desc 是否有任一 dom 看不見 */
      let anyDomCantVisible = false
      for (let i = 0; i < itemInfoList.length; i++) {
        const itemInfo = itemInfoList[i]
        const dom = wrapDom.children[i] as HTMLElement

        if (itemInfo._new) {
          itemInfo._new = false
          itemInfo.x = wrapDom.clientWidth
          itemInfo.y = 0
          itemInfo.width = dom.clientWidth
          itemInfo.height = dom.clientHeight

          // -2 是因為過濾自己
          const lastItemInfo = itemInfoList[itemInfoList.length - 2]
          if (lastItemInfo != null) {
            const bottomY = lastItemInfo.y + lastItemInfo.height + gapY
            /** @desc 剩餘高度 */
            const overHeight = wrapDom.clientHeight - bottomY

            if (overHeight < itemInfo.height) {
              let lastTopX = wrapDom.clientWidth
              for (let j = itemInfoList.length - 3; j >= 0; j--) {
                const prevItemInfo = itemInfoList[j]
                if (prevItemInfo.y === 0) {
                  const prevX = prevItemInfo.x + prevItemInfo.width + gapX

                  if (prevX < wrapDom.clientWidth) {
                    lastTopX = wrapDom.clientWidth + gapX
                  } else {
                    lastTopX = prevX
                  }

                  break
                }
              }
              itemInfo.x = lastTopX
              itemInfo.y = 0
              continue
            }

            itemInfo.y = bottomY
          }
        } else {
          itemInfo.x = itemInfo.x - itemInfo.rate

          if (itemInfo.x + itemInfo.width < 0) {
            anyDomCantVisible = true
            itemInfoList.splice(i--, 1)
            continue
          }
        }

        dom.style.transform = `translate3d(${itemInfo.x}px, ${itemInfo.y}px, 0)`
      }

      if (anyDomCantVisible) {
        setItemInfoList([...itemInfoList])
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

const BASE_BARRAGE_ITEM_CLASSNAME = 'absolute left-0 top-0'
function BarrageItem <T extends BarrageType>(
  {
    type,
    data,
  }: BarrageItem<T>
) {
  if (type === BARRAGE_TYPE_NOBLE) {
    return (
      <div
        className={clsx(BASE_BARRAGE_ITEM_CLASSNAME, 'w-fit bg-red-300 rounded-[50px] flex items-center px-2 py-1 text-black')}>
        <Avatar />
        <span>BARRAGE_TYPE_NOBLE(貴族)<br />{Math.random()}</span>
      </div>
    )
  } else if (type === BARRAGE_TYPE_BET_WIN) {
    return (
      <div className={clsx(BASE_BARRAGE_ITEM_CLASSNAME, 'w-fit bg-green-300 rounded-[50px] px-3 py-1 text-[12px] text-black')}>
        BARRAGE_TYPE_NOBLE(投注中獎)
      </div>
    )
  } else if (type === BARRAGE_TYPE_STEED) {
    return (
      <div className={clsx(BASE_BARRAGE_ITEM_CLASSNAME, 'w-fit bg-yellow-300 rounded-[50px] px-2 py-1 text-black')}>
        BARRAGE_TYPE_NOBLE(坐騎)
      </div>
    )
  }

  return <div />
}

const MemoBarrageItem = memo<BarragePrivateItem<any>>(BarrageItem, (prevProps, currentProps) => prevProps._id === currentProps._id)

function Avatar () {
  function handleClick() {
    console.log('avatar')
  }

  return <div className="rounded-full bg-red-500 w-10 h-10 mr-2" onClick={handleClick} />
}

function appendBarrageItem<T extends BarrageType> (item: BarrageItem<T>) {
  mittEmit('ROOM_BARRAGE_APPEND', item)
}

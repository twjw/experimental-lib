import mitt, { type Handler } from 'mitt'
import { useEffect } from 'react'
import {BarrageAppendMiteType, BarrageItem} from "../../main.tsx";

type MittType =
	| BarrageAppendMiteType
	| 'WINDOW_RESIZE' // 介面尺寸變化

// prettier-ignore
type MittState<MT extends MittType> =
	MT extends BarrageAppendMiteType
  	? BarrageItem<any>
	: MT extends 'WINDOW_RESIZE'
  	? WINDOW_RESIZE_MITT_EVENT
  : undefined

export type WINDOW_RESIZE_MITT_EVENT = {
	width: number
	height: number
}

const emitter = mitt()

export function useMittOn<T extends MittType, EV = MittState<T>>(
	type: T,
	listener: (event: EV) => void,
	isDepListener = false,
) {
	useEffect(() => {
		emitter.on(type, listener as Handler)

		return () => {
			emitter.off(type, listener as Handler)
		}
	}, [type, isDepListener ? listener : null])
}

export function mittEmit<MT extends MittType>(
	type: MT,
	...args: MittState<MT> extends undefined ? [] : [MittState<MT>]
) {
	emitter.emit(type, args[0])
}

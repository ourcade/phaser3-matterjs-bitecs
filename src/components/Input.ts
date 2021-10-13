import {
	defineComponent,
	Types
} from 'bitecs'

export const Input = defineComponent({
	up: Types.ui8,
	down: Types.ui8,
	left: Types.ui8,
	right: Types.ui8
})

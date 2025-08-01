import {Millisecond} from '../../../aa/atype/a_define_units'
import AaRateLimit from './ratelimit'
import type {BasicRequestStruct} from '../base/define_interfaces'
import {AError} from '../../../aa/aerror/error'

export default class AaMiddleware {
    readonly rateLimit: AaRateLimit
    readonly debounceInterval: number = 0

    constructor(debounceInterval: number = 400 * Millisecond) {
        this.rateLimit = new AaRateLimit(debounceInterval)
    }

    denied(r: BasicRequestStruct): false | AError {
        return this.rateLimit.denied(r)
    }
}
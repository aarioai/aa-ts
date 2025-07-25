import {HttpImpl, RequestHooks, RequestImpl, RequestOptions, RequestStruct} from '../base/define_interfaces'
import AaAuth from '../auth/auth'
import type {ResponseBodyData} from '../../../aa/atype/a_server_dto'
import {normalizeBasicRequestOptions, normalizeRequestOptions} from '../base/fn'
import {unsafeUnion} from '../../../basic/maps/groups'
import type {Dict} from '../../../aa/atype/a_define_interfaces'
import {aerror} from '../../../aa/aerror/fn'
import {E_OK, E_Unauthorized} from '../../../aa/aerror/errors'
import type {t_httpmethod} from '../../../aa/atype/enums/http_method'
import type {t_url_pattern} from '../../../aa/atype/a_define'
import log from '../../../aa/alog/log.ts'

export default class AaFetch implements HttpImpl {
    readonly auth: AaAuth
    readonly base: RequestImpl
    enableDebug = false

    constructor(auth: AaAuth) {
        this.auth = auth
        this.base = auth.request
    }

    handleRedirect(path: string): unknown {
        location.href = path
        return
    }

    fetch(r: RequestStruct, hooks?: RequestHooks): Promise<string> {
        return this.base.Fetch(r.url.href, normalizeBasicRequestOptions(r.url.href, r, this.base.defaultHeader), hooks)
    }

    Fetch(api: t_url_pattern, options?: RequestOptions, hooks?: RequestHooks): Promise<string> {
        return this.normalizeOptions(api, options).then(r => this.fetch(r, hooks)
        )
    }

    request<T = ResponseBodyData>(r: RequestStruct, hooks?: RequestHooks): Promise<T> {
        return this.base.request<T>(r, hooks).catch(e => {
            e = aerror(e)
            if (e.isFailedAndSeeOther()) {
                this.handleRedirect(e.message)  // special redirect
                throw E_OK
            }
            if (e.isUnauthorized()) {
                if (this.auth.handleUnauthorized(e)) {
                    throw E_OK
                }
            }
            throw e
        })
    }

    Request<T = ResponseBodyData>(api: t_url_pattern, options?: RequestOptions): Promise<T> {
        return this.normalizeOptions(api, options).then(r => this.request<T>(r))
    }

    head(r: RequestStruct, hooks?: RequestHooks): Promise<void> {
        r.method = 'HEAD'
        return this.base.head(r, hooks)
    }

    Head(api: t_url_pattern, options?: RequestOptions, hooks?: RequestHooks): Promise<void> {
        return this.normalizeOptions(api, options, 'HEAD').then(r => this.head(r, hooks))
    }

    get<T = ResponseBodyData>(r: RequestStruct, hooks?: RequestHooks): Promise<T> {
        r.method = 'GET'
        return this.request<T>(r, hooks) as Promise<T>
    }

    Get<T = ResponseBodyData>(api: t_url_pattern, options?: RequestOptions, hooks?: RequestHooks): Promise<T> {
        return this.normalizeOptions(api, options, 'GET').then(r => this.get<T>(r, hooks))
    }

    delete<T = ResponseBodyData>(r: RequestStruct, hooks?: RequestHooks): Promise<T> {
        r.method = 'DELETE'
        return this.request<T>(r, hooks) as Promise<T>
    }

    Delete<T = ResponseBodyData>(api: t_url_pattern, options?: RequestOptions, hooks?: RequestHooks): Promise<T> {
        return this.normalizeOptions(api, options, 'GET').then(r => this.delete<T>(r, hooks))
    }

    post<T = ResponseBodyData>(r: RequestStruct, hooks?: RequestHooks): Promise<T> {
        r.method = 'POST'
        return this.request<T>(r, hooks) as Promise<T>
    }

    Post<T = ResponseBodyData>(api: t_url_pattern, options?: RequestOptions, hooks?: RequestHooks): Promise<T> {
        return this.normalizeOptions(api, options, 'POST').then(r => this.post<T>(r, hooks))
    }

    put<T = ResponseBodyData>(r: RequestStruct, hooks?: RequestHooks): Promise<T> {
        r.method = 'PUT'
        return this.request<T>(r, hooks) as Promise<T>
    }

    Put<T = ResponseBodyData>(api: t_url_pattern, options?: RequestOptions, hooks?: RequestHooks): Promise<T> {
        return this.normalizeOptions(api, options, 'PUT').then(r => this.put<T>(r, hooks))
    }

    patch<T = ResponseBodyData>(r: RequestStruct, hooks?: RequestHooks): Promise<T> {
        r.method = 'PATCH'
        return this.request<T>(r, hooks) as Promise<T>
    }

    Patch<T = ResponseBodyData>(api: t_url_pattern, options?: RequestOptions, hooks?: RequestHooks): Promise<T> {
        return this.normalizeOptions(api, options, 'PATCH').then(r => this.patch<T>(r, hooks))
    }

    private debug(...msgs: unknown[]) {
        if (!this.enableDebug) {
            return
        }
        log.debug('AaFetch', ...msgs)
    }

    private async normalizeOptions(api: t_url_pattern, options?: RequestOptions, method?: t_httpmethod): Promise<RequestStruct> {
        options = this.base.normalizeOptions(options, method)
        // Merge auth options
        if (!options.disableAuth) {
            try {
                const auth = await this.auth.getAuthorizationOptions()
                this.debug("auth data", auth)
                options = unsafeUnion(options as Dict, auth as Dict)
                this.debug("merge auth data into options", options)
            } catch (e) {
                if (options.mustAuth) {
                    throw E_Unauthorized
                }
            }

        }
        const result = normalizeRequestOptions(api, options)
        this.debug("normalize request options", result)
        return result
    }
}
let wasm_bindgen;
(function() {
    const __exports = {};
    let script_src;
    if (typeof document !== 'undefined' && document.currentScript !== null) {
        script_src = new URL(document.currentScript.src, location.href).toString();
    }
    let wasm = undefined;

    function logError(f, args) {
        try {
            return f.apply(this, args);
        } catch (e) {
            let error = (function () {
                try {
                    return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
                } catch(_) {
                    return "<failed to stringify thrown value>";
                }
            }());
            console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
            throw e;
        }
    }

    const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

    if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

    let cachedUint8ArrayMemory0 = null;

    function getUint8ArrayMemory0() {
        if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer) {
            cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8ArrayMemory0;
    }

    function getStringFromWasm0(ptr, len) {
        ptr = ptr >>> 0;
        return cachedTextDecoder.decode(getUint8ArrayMemory0().slice(ptr, ptr + len));
    }

    function addToExternrefTable0(obj) {
        const idx = wasm.__externref_table_alloc();
        wasm.__wbindgen_export_3.set(idx, obj);
        return idx;
    }

    function handleError(f, args) {
        try {
            return f.apply(this, args);
        } catch (e) {
            const idx = addToExternrefTable0(e);
            wasm.__wbindgen_exn_store(idx);
        }
    }

    function _assertBoolean(n) {
        if (typeof(n) !== 'boolean') {
            throw new Error(`expected a boolean argument, found ${typeof(n)}`);
        }
    }

    let WASM_VECTOR_LEN = 0;

    const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

    const encodeString = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };

    function passStringToWasm0(arg, malloc, realloc) {

        if (typeof(arg) !== 'string') throw new Error(`expected a string argument, found ${typeof(arg)}`);

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length, 1) >>> 0;
            getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len, 1) >>> 0;

        const mem = getUint8ArrayMemory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
            const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);
            if (ret.read !== arg.length) throw new Error('failed to pass whole string');
            offset += ret.written;
            ptr = realloc(ptr, len, offset, 1) >>> 0;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    let cachedDataViewMemory0 = null;

    function getDataViewMemory0() {
        if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
            cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
        }
        return cachedDataViewMemory0;
    }

    function _assertNum(n) {
        if (typeof(n) !== 'number') throw new Error(`expected a number argument, found ${typeof(n)}`);
    }

    function isLikeNone(x) {
        return x === undefined || x === null;
    }

    const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(state => {
        wasm.__wbindgen_export_7.get(state.dtor)(state.a, state.b)
    });

    function makeMutClosure(arg0, arg1, dtor, f) {
        const state = { a: arg0, b: arg1, cnt: 1, dtor };
        const real = (...args) => {
            // First up with a closure we increment the internal reference
            // count. This ensures that the Rust closure environment won't
            // be deallocated while we're invoking it.
            state.cnt++;
            const a = state.a;
            state.a = 0;
            try {
                return f(a, state.b, ...args);
            } finally {
                if (--state.cnt === 0) {
                    wasm.__wbindgen_export_7.get(state.dtor)(a, state.b);
                    CLOSURE_DTORS.unregister(state);
                } else {
                    state.a = a;
                }
            }
        };
        real.original = state;
        CLOSURE_DTORS.register(real, state, state);
        return real;
    }

    function debugString(val) {
        // primitive types
        const type = typeof val;
        if (type == 'number' || type == 'boolean' || val == null) {
            return  `${val}`;
        }
        if (type == 'string') {
            return `"${val}"`;
        }
        if (type == 'symbol') {
            const description = val.description;
            if (description == null) {
                return 'Symbol';
            } else {
                return `Symbol(${description})`;
            }
        }
        if (type == 'function') {
            const name = val.name;
            if (typeof name == 'string' && name.length > 0) {
                return `Function(${name})`;
            } else {
                return 'Function';
            }
        }
        // objects
        if (Array.isArray(val)) {
            const length = val.length;
            let debug = '[';
            if (length > 0) {
                debug += debugString(val[0]);
            }
            for(let i = 1; i < length; i++) {
                debug += ', ' + debugString(val[i]);
            }
            debug += ']';
            return debug;
        }
        // Test for built-in
        const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
        let className;
        if (builtInMatches && builtInMatches.length > 1) {
            className = builtInMatches[1];
        } else {
            // Failed to match the standard '[object ClassName]'
            return toString.call(val);
        }
        if (className == 'Object') {
            // we're a user defined class or Object
            // JSON.stringify avoids problems with cycles, and is generally much
            // easier than looping through ownProperties of `val`.
            try {
                return 'Object(' + JSON.stringify(val) + ')';
            } catch (_) {
                return 'Object';
            }
        }
        // errors
        if (val instanceof Error) {
            return `${val.name}: ${val.message}\n${val.stack}`;
        }
        // TODO we could test for more things here, like `Set`s and `Map`s.
        return className;
    }
    /**
     * @returns {number}
     */
    __exports.frb_get_rust_content_hash = function() {
        const ret = wasm.frb_get_rust_content_hash();
        return ret;
    };

    /**
     * @param {number} func_id
     * @param {any} port_
     * @param {any} ptr_
     * @param {number} rust_vec_len_
     * @param {number} data_len_
     */
    __exports.frb_pde_ffi_dispatcher_primary = function(func_id, port_, ptr_, rust_vec_len_, data_len_) {
        _assertNum(func_id);
        _assertNum(rust_vec_len_);
        _assertNum(data_len_);
        wasm.frb_pde_ffi_dispatcher_primary(func_id, port_, ptr_, rust_vec_len_, data_len_);
    };

    /**
     * @param {number} func_id
     * @param {any} ptr_
     * @param {number} rust_vec_len_
     * @param {number} data_len_
     * @returns {any}
     */
    __exports.frb_pde_ffi_dispatcher_sync = function(func_id, ptr_, rust_vec_len_, data_len_) {
        _assertNum(func_id);
        _assertNum(rust_vec_len_);
        _assertNum(data_len_);
        const ret = wasm.frb_pde_ffi_dispatcher_sync(func_id, ptr_, rust_vec_len_, data_len_);
        return ret;
    };

    /**
     * @param {number} call_id
     * @param {any} ptr_
     * @param {number} rust_vec_len_
     * @param {number} data_len_
     */
    __exports.frb_dart_fn_deliver_output = function(call_id, ptr_, rust_vec_len_, data_len_) {
        _assertNum(call_id);
        _assertNum(rust_vec_len_);
        _assertNum(data_len_);
        wasm.frb_dart_fn_deliver_output(call_id, ptr_, rust_vec_len_, data_len_);
    };

    /**
     * @param {number} ptr
     */
    __exports.rust_arc_increment_strong_count_RustOpaque_flutter_rust_bridgefor_generatedRustAutoOpaqueInnerAttributeValue = function(ptr) {
        _assertNum(ptr);
        wasm.rust_arc_increment_strong_count_RustOpaque_flutter_rust_bridgefor_generatedRustAutoOpaqueInnerAttributeValue(ptr);
    };

    /**
     * @param {number} ptr
     */
    __exports.rust_arc_decrement_strong_count_RustOpaque_flutter_rust_bridgefor_generatedRustAutoOpaqueInnerAttributeValue = function(ptr) {
        _assertNum(ptr);
        wasm.rust_arc_decrement_strong_count_RustOpaque_flutter_rust_bridgefor_generatedRustAutoOpaqueInnerAttributeValue(ptr);
    };

    /**
     * @param {number} ptr
     */
    __exports.rust_arc_increment_strong_count_RustOpaque_flutter_rust_bridgefor_generatedRustAutoOpaqueInnerCoreClient = function(ptr) {
        _assertNum(ptr);
        wasm.rust_arc_increment_strong_count_RustOpaque_flutter_rust_bridgefor_generatedRustAutoOpaqueInnerCoreClient(ptr);
    };

    /**
     * @param {number} ptr
     */
    __exports.rust_arc_decrement_strong_count_RustOpaque_flutter_rust_bridgefor_generatedRustAutoOpaqueInnerCoreClient = function(ptr) {
        _assertNum(ptr);
        wasm.rust_arc_decrement_strong_count_RustOpaque_flutter_rust_bridgefor_generatedRustAutoOpaqueInnerCoreClient(ptr);
    };

    function passArrayJsValueToWasm0(array, malloc) {
        const ptr = malloc(array.length * 4, 4) >>> 0;
        for (let i = 0; i < array.length; i++) {
            const add = addToExternrefTable0(array[i]);
            getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
        }
        WASM_VECTOR_LEN = array.length;
        return ptr;
    }

    function takeFromExternrefTable0(idx) {
        const value = wasm.__wbindgen_export_3.get(idx);
        wasm.__externref_table_dealloc(idx);
        return value;
    }
    /**
     * ## Safety
     * This function reclaims a raw pointer created by [`TransferClosure`], and therefore
     * should **only** be used in conjunction with it.
     * Furthermore, the WASM module in the worker must have been initialized with the shared
     * memory from the host JS scope.
     * @param {number} payload
     * @param {any[]} transfer
     */
    __exports.receive_transfer_closure = function(payload, transfer) {
        _assertNum(payload);
        const ptr0 = passArrayJsValueToWasm0(transfer, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.receive_transfer_closure(payload, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    };

    /**
     * # Safety
     *
     * This should never be called manually.
     * @param {any} handle
     * @param {any} dart_handler_port
     * @returns {number}
     */
    __exports.frb_dart_opaque_dart2rust_encode = function(handle, dart_handler_port) {
        const ret = wasm.frb_dart_opaque_dart2rust_encode(handle, dart_handler_port);
        return ret >>> 0;
    };

    /**
     * @param {number} ptr
     */
    __exports.frb_dart_opaque_drop_thread_box_persistent_handle = function(ptr) {
        _assertNum(ptr);
        wasm.frb_dart_opaque_drop_thread_box_persistent_handle(ptr);
    };

    /**
     * @param {number} ptr
     * @returns {any}
     */
    __exports.frb_dart_opaque_rust2dart_decode = function(ptr) {
        _assertNum(ptr);
        const ret = wasm.frb_dart_opaque_rust2dart_decode(ptr);
        return ret;
    };

    __exports.wasm_start_callback = function() {
        wasm.wasm_start_callback();
    };

    function __wbg_adapter_36(arg0, arg1) {
        _assertNum(arg0);
        _assertNum(arg1);
        wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h98bbfe2a40529f86(arg0, arg1);
    }

    function __wbg_adapter_39(arg0, arg1, arg2) {
        _assertNum(arg0);
        _assertNum(arg1);
        wasm.closure1077_externref_shim(arg0, arg1, arg2);
    }

    function __wbg_adapter_42(arg0, arg1, arg2) {
        _assertNum(arg0);
        _assertNum(arg1);
        wasm.closure1107_externref_shim(arg0, arg1, arg2);
    }

    function __wbg_adapter_45(arg0, arg1, arg2) {
        _assertNum(arg0);
        _assertNum(arg1);
        wasm.closure1105_externref_shim(arg0, arg1, arg2);
    }

    function __wbg_adapter_178(arg0, arg1, arg2, arg3) {
        _assertNum(arg0);
        _assertNum(arg1);
        wasm.closure1185_externref_shim(arg0, arg1, arg2, arg3);
    }

    const WorkerPoolFinalization = (typeof FinalizationRegistry === 'undefined')
        ? { register: () => {}, unregister: () => {} }
        : new FinalizationRegistry(ptr => wasm.__wbg_workerpool_free(ptr >>> 0, 1));

    class WorkerPool {

        __destroy_into_raw() {
            const ptr = this.__wbg_ptr;
            this.__wbg_ptr = 0;
            WorkerPoolFinalization.unregister(this);
            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_workerpool_free(ptr, 0);
        }
        /**
         * Creates a new `WorkerPool` which immediately creates `initial` workers.
         *
         * The pool created here can be used over a long period of time, and it
         * will be initially primed with `initial` workers. Currently workers are
         * never released or gc'd until the whole pool is destroyed.
         *
         * # Errors
         *
         * Returns any error that may happen while a JS web worker is created and a
         * message is sent to it.
         * @param {number} initial
         * @param {string} script_src
         */
        constructor(initial, script_src) {
            _assertNum(initial);
            const ptr0 = passStringToWasm0(script_src, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.workerpool_new(initial, ptr0, len0);
            if (ret[2]) {
                throw takeFromExternrefTable0(ret[1]);
            }
            this.__wbg_ptr = ret[0] >>> 0;
            WorkerPoolFinalization.register(this, this.__wbg_ptr, this);
            return this;
        }
    }
    __exports.WorkerPool = WorkerPool;

    async function __wbg_load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    function __wbg_get_imports() {
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbg_abort_b2f5cff224272d63 = function() { return logError(function (arg0) {
            arg0.abort();
        }, arguments) };
        imports.wbg.__wbg_append_bb16b42637444e9d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments) };
        imports.wbg.__wbg_arrayBuffer_b6fff4ef4ec59b14 = function() { return handleError(function (arg0) {
            const ret = arg0.arrayBuffer();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_async_9ca1ed9ad77fdc41 = function() { return logError(function (arg0) {
            const ret = arg0.async;
            _assertBoolean(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_buffer_609cc3eee51ed158 = function() { return logError(function (arg0) {
            const ret = arg0.buffer;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_createObjectURL_79d470fef236d558 = function() { return handleError(function (arg0, arg1) {
            const ret = URL.createObjectURL(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments) };
        imports.wbg.__wbg_data_6152a00ad18cc93e = function() { return logError(function (arg0) {
            const ret = arg0.data;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_done_769e5ede4b31c67b = function() { return logError(function (arg0) {
            const ret = arg0.done;
            _assertBoolean(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function() { return logError(function (arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        }, arguments) };
        imports.wbg.__wbg_error_803b81921fddf387 = function() { return logError(function (arg0, arg1) {
            console.error(getStringFromWasm0(arg0, arg1));
        }, arguments) };
        imports.wbg.__wbg_eval_e10dc02e9547f640 = function() { return handleError(function (arg0, arg1) {
            const ret = eval(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments) };
        imports.wbg.__wbg_fetch_4465c2b10f21a927 = function() { return logError(function (arg0) {
            const ret = fetch(arg0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_fetch_ebfbf72e60b90f6b = function() { return logError(function (arg0, arg1) {
            const ret = arg0.fetch(arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_getRandomValues_994e6d041c9fc2c1 = function() { return handleError(function (arg0) {
            globalThis.crypto.getRandomValues(arg0);
        }, arguments) };
        imports.wbg.__wbg_getTime_46267b1c24877e30 = function() { return logError(function (arg0) {
            const ret = arg0.getTime();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_get_67b2ba62fc30de12 = function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_has_a5ea9117f258a0ec = function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.has(arg0, arg1);
            _assertBoolean(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_headers_1cb36cb1f63b1803 = function() { return logError(function (arg0) {
            const ret = arg0.headers;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_instanceof_BroadcastChannel_60bd590f9d3b0260 = function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof BroadcastChannel;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_instanceof_ErrorEvent_1fbb8880e36d3e27 = function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof ErrorEvent;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_instanceof_MessageEvent_e3198df1169175bd = function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof MessageEvent;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_instanceof_Response_5b683150ad96eb73 = function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof Response;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_iterator_9a24c88df860dc65 = function() { return logError(function () {
            const ret = Symbol.iterator;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_length_a446193dc22c12f8 = function() { return logError(function (arg0) {
            const ret = arg0.length;
            _assertNum(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_log_f259040c837ddc78 = function() { return logError(function (arg0, arg1) {
            console.log(getStringFromWasm0(arg0, arg1));
        }, arguments) };
        imports.wbg.__wbg_message_88e9e8e91b42ea74 = function() { return logError(function (arg0, arg1) {
            const ret = arg1.message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments) };
        imports.wbg.__wbg_name_8faa67d44d6cd962 = function() { return logError(function (arg0, arg1) {
            const ret = arg1.name;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments) };
        imports.wbg.__wbg_new0_f788a2397c7ca929 = function() { return logError(function () {
            const ret = new Date();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_2252d3c38373cda1 = function() { return handleError(function () {
            const ret = new AbortController();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_23a2665fac83c611 = function() { return logError(function (arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return __wbg_adapter_178(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = state0.b = 0;
            }
        }, arguments) };
        imports.wbg.__wbg_new_3095e6bbfba47371 = function() { return handleError(function () {
            const ret = new Headers();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_405e22f390576ce2 = function() { return logError(function () {
            const ret = new Object();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_5058868050263ba8 = function() { return handleError(function (arg0, arg1) {
            const ret = new Worker(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_78feb108b6472713 = function() { return logError(function () {
            const ret = new Array();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_8a6f238a6ece86ea = function() { return logError(function () {
            const ret = new Error();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_a12002a7f91c75be = function() { return logError(function (arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_d496440aad4c230a = function() { return handleError(function (arg0, arg1) {
            const ret = new BroadcastChannel(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments) };
        imports.wbg.__wbg_new_e9a4a67dbababe57 = function() { return logError(function (arg0) {
            const ret = new Int32Array(arg0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_newnoargs_105ed471475aaf50 = function() { return logError(function (arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments) };
        imports.wbg.__wbg_newwithblobsequenceandoptions_00459cf5eb2b1204 = function() { return handleError(function (arg0, arg1) {
            const ret = new Blob(arg0, arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function() { return logError(function (arg0, arg1, arg2) {
            const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_newwithlength_a381634e90c276d4 = function() { return logError(function (arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_newwithstrandinit_5bf797e91a4e2e6f = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_next_25feadfc0913fea9 = function() { return logError(function (arg0) {
            const ret = arg0.next;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_next_6574e1a8a62d1055 = function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_now_fb0466b5460cff09 = function() { return logError(function (arg0) {
            const ret = arg0.now();
            return ret;
        }, arguments) };
        imports.wbg.__wbg_of_4a05197bfc89556f = function() { return logError(function (arg0, arg1, arg2) {
            const ret = Array.of(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_performance_71b063e177862740 = function() { return logError(function (arg0) {
            const ret = arg0.performance;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_postMessage_20fd07f0468eae56 = function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments) };
        imports.wbg.__wbg_postMessage_231a86892b231348 = function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments) };
        imports.wbg.__wbg_postMessage_bbd507b36e845f0a = function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments) };
        imports.wbg.__wbg_push_737cfc8c1432c2c6 = function() { return logError(function (arg0, arg1) {
            const ret = arg0.push(arg1);
            _assertNum(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_queueMicrotask_6808622725a52272 = function() { return logError(function (arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_queueMicrotask_ef0e86b0263a71ee = function() { return logError(function (arg0) {
            queueMicrotask(arg0);
        }, arguments) };
        imports.wbg.__wbg_resolve_4851785c9c5f573d = function() { return logError(function (arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_setTimeout_25eabdb2fc442ea2 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.setTimeout(arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_set_65595bdd868b3009 = function() { return logError(function (arg0, arg1, arg2) {
            arg0.set(arg1, arg2 >>> 0);
        }, arguments) };
        imports.wbg.__wbg_set_bb8cecf6a62b9f46 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            _assertBoolean(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_setonerror_d66f0397042b9d8f = function() { return logError(function (arg0, arg1) {
            arg0.onerror = arg1;
        }, arguments) };
        imports.wbg.__wbg_setonmessage_e058388277378cba = function() { return logError(function (arg0, arg1) {
            arg0.onmessage = arg1;
        }, arguments) };
        imports.wbg.__wbg_signal_78d7b08c603f7438 = function() { return logError(function (arg0) {
            const ret = arg0.signal;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_stack_0ed75d68575b0f3c = function() { return logError(function (arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments) };
        imports.wbg.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() { return logError(function () {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments) };
        imports.wbg.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() { return logError(function () {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments) };
        imports.wbg.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() { return logError(function () {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments) };
        imports.wbg.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() { return logError(function () {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments) };
        imports.wbg.__wbg_status_f596e12a59e37fac = function() { return logError(function (arg0) {
            const ret = arg0.status;
            _assertNum(ret);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_stringify_f7ed6987935b4a24 = function() { return handleError(function (arg0) {
            const ret = JSON.stringify(arg0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_subarray_aa9065fa9dc5df96 = function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_then_44b73946d2fb3e7d = function() { return logError(function (arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_then_48b406749878a531 = function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_url_af72aa58d8ae19c5 = function() { return logError(function (arg0, arg1) {
            const ret = arg1.url;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments) };
        imports.wbg.__wbg_value_1751656e93d33fc5 = function() { return logError(function (arg0) {
            const ret = arg0.value;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_value_cd1ffa7b1ab794f1 = function() { return logError(function (arg0) {
            const ret = arg0.value;
            return ret;
        }, arguments) };
        imports.wbg.__wbg_waitAsync_376530aff4e7ea42 = function() { return logError(function (arg0, arg1, arg2) {
            const ret = Atomics.waitAsync(arg0, arg1, arg2);
            return ret;
        }, arguments) };
        imports.wbg.__wbg_waitAsync_f781d3b9c6cea5c0 = function() { return logError(function () {
            const ret = Atomics.waitAsync;
            return ret;
        }, arguments) };
        imports.wbg.__wbindgen_cb_drop = function(arg0) {
            const obj = arg0.original;
            if (obj.cnt-- == 1) {
                obj.a = 0;
                return true;
            }
            const ret = false;
            _assertBoolean(ret);
            return ret;
        };
        imports.wbg.__wbindgen_closure_wrapper19892 = function() { return logError(function (arg0, arg1, arg2) {
            const ret = makeMutClosure(arg0, arg1, 884, __wbg_adapter_36);
            return ret;
        }, arguments) };
        imports.wbg.__wbindgen_closure_wrapper25053 = function() { return logError(function (arg0, arg1, arg2) {
            const ret = makeMutClosure(arg0, arg1, 1078, __wbg_adapter_39);
            return ret;
        }, arguments) };
        imports.wbg.__wbindgen_closure_wrapper26066 = function() { return logError(function (arg0, arg1, arg2) {
            const ret = makeMutClosure(arg0, arg1, 1108, __wbg_adapter_42);
            return ret;
        }, arguments) };
        imports.wbg.__wbindgen_closure_wrapper26068 = function() { return logError(function (arg0, arg1, arg2) {
            const ret = makeMutClosure(arg0, arg1, 1106, __wbg_adapter_45);
            return ret;
        }, arguments) };
        imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        };
        imports.wbg.__wbindgen_init_externref_table = function() {
            const table = wasm.__wbindgen_export_3;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
            ;
        };
        imports.wbg.__wbindgen_is_function = function(arg0) {
            const ret = typeof(arg0) === 'function';
            _assertBoolean(ret);
            return ret;
        };
        imports.wbg.__wbindgen_is_object = function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            _assertBoolean(ret);
            return ret;
        };
        imports.wbg.__wbindgen_is_undefined = function(arg0) {
            const ret = arg0 === undefined;
            _assertBoolean(ret);
            return ret;
        };
        imports.wbg.__wbindgen_jsval_eq = function(arg0, arg1) {
            const ret = arg0 === arg1;
            _assertBoolean(ret);
            return ret;
        };
        imports.wbg.__wbindgen_link_fc1eedd35dc7e0a6 = function() { return logError(function (arg0) {
            const val = `onmessage = function (ev) {
                let [ia, index, value] = ev.data;
                ia = new Int32Array(ia.buffer);
                let result = Atomics.wait(ia, index, value);
                postMessage(result);
            };
            `;
            const ret = typeof URL.createObjectURL === 'undefined' ? "data:application/javascript," + encodeURIComponent(val) : URL.createObjectURL(new Blob([val], { type: "text/javascript" }));
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments) };
        imports.wbg.__wbindgen_memory = function() {
            const ret = wasm.memory;
            return ret;
        };
        imports.wbg.__wbindgen_module = function() {
            const ret = __wbg_init.__wbindgen_wasm_module;
            return ret;
        };
        imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            if (!isLikeNone(ret)) {
                _assertNum(ret);
            }
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        };
        imports.wbg.__wbindgen_number_new = function(arg0) {
            const ret = arg0;
            return ret;
        };
        imports.wbg.__wbindgen_rethrow = function(arg0) {
            throw arg0;
        };
        imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        };
        imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };

        return imports;
    }

    function __wbg_init_memory(imports, memory) {
        imports.wbg.memory = memory || new WebAssembly.Memory({initial:32,maximum:16384,shared:true});
    }

    function __wbg_finalize_init(instance, module, thread_stack_size) {
        wasm = instance.exports;
        __wbg_init.__wbindgen_wasm_module = module;
        cachedDataViewMemory0 = null;
        cachedUint8ArrayMemory0 = null;

        if (typeof thread_stack_size !== 'undefined' && (typeof thread_stack_size !== 'number' || thread_stack_size === 0 || thread_stack_size % 65536 !== 0)) { throw 'invalid stack size' }
        wasm.__wbindgen_start(thread_stack_size);
        return wasm;
    }

    function initSync(module, memory) {
        if (wasm !== undefined) return wasm;

        let thread_stack_size
        if (typeof module !== 'undefined') {
            if (Object.getPrototypeOf(module) === Object.prototype) {
                ({module, memory, thread_stack_size} = module)
            } else {
                console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
            }
        }

        const imports = __wbg_get_imports();

        __wbg_init_memory(imports, memory);

        if (!(module instanceof WebAssembly.Module)) {
            module = new WebAssembly.Module(module);
        }

        const instance = new WebAssembly.Instance(module, imports);

        return __wbg_finalize_init(instance, module, thread_stack_size);
    }

    async function __wbg_init(module_or_path, memory) {
        if (wasm !== undefined) return wasm;

        let thread_stack_size
        if (typeof module_or_path !== 'undefined') {
            if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
                ({module_or_path, memory, thread_stack_size} = module_or_path)
            } else {
                console.warn('using deprecated parameters for the initialization function; pass a single object instead')
            }
        }

        if (typeof module_or_path === 'undefined' && typeof script_src !== 'undefined') {
            module_or_path = script_src.replace(/\.js$/, '_bg.wasm');
        }
        const imports = __wbg_get_imports();

        if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
            module_or_path = fetch(module_or_path);
        }

        __wbg_init_memory(imports, memory);

        const { instance, module } = await __wbg_load(await module_or_path, imports);

        return __wbg_finalize_init(instance, module, thread_stack_size);
    }

    wasm_bindgen = Object.assign(__wbg_init, { initSync }, __exports);

})();

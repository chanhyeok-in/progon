var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Serialize } from 'eosjs';
import sha256 from 'fast-sha256';
import * as abi from './abi';
import * as base64u from './base64u';
const ProtocolVersion = 2;
const AbiTypes = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi.data);
export var ChainName;
(function (ChainName) {
    ChainName[ChainName["UNKNOWN"] = 0] = "UNKNOWN";
    ChainName[ChainName["EOS"] = 1] = "EOS";
    ChainName[ChainName["TELOS"] = 2] = "TELOS";
    ChainName[ChainName["JUNGLE"] = 3] = "JUNGLE";
    ChainName[ChainName["KYLIN"] = 4] = "KYLIN";
    ChainName[ChainName["WORBLI"] = 5] = "WORBLI";
    ChainName[ChainName["BOS"] = 6] = "BOS";
    ChainName[ChainName["MEETONE"] = 7] = "MEETONE";
    ChainName[ChainName["INSIGHTS"] = 8] = "INSIGHTS";
    ChainName[ChainName["BEOS"] = 9] = "BEOS";
    ChainName[ChainName["WAX"] = 10] = "WAX";
    ChainName[ChainName["PROTON"] = 11] = "PROTON";
    ChainName[ChainName["FIO"] = 12] = "FIO";
})(ChainName || (ChainName = {}));
const ChainIdLookup = new Map([
    [ChainName.EOS, 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'],
    [ChainName.TELOS, '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11'],
    [ChainName.JUNGLE, 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'],
    [ChainName.KYLIN, '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'],
    [ChainName.WORBLI, '73647cde120091e0a4b85bced2f3cfdb3041e266cbbe95cee59b73235a1b3b6f'],
    [ChainName.BOS, 'd5a3d18fbb3c084e3b1f3fa98c21014b5f3db536cc15d08f9f6479517c6a3d86'],
    [ChainName.MEETONE, 'cfe6486a83bad4962f232d48003b1824ab5665c36778141034d75e57b956e422'],
    [ChainName.INSIGHTS, 'b042025541e25a472bffde2d62edd457b7e70cee943412b1ea0f044f88591664'],
    [ChainName.BEOS, 'b912d19a6abd2b1b05611ae5be473355d64d95aeff0c09bedc8c166cd6468fe4'],
    [ChainName.WAX, '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'],
    [ChainName.PROTON, '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0'],
    [ChainName.FIO, '21dcae42c0182200e93f954a074011f9048a7624c6fe81d3c9541a614a88bd1c'],
]);
const DEFAULT_SCHEME = 'esr';
export const PlaceholderName = '............1';
export const PlaceholderPermission = '............2';
export const PlaceholderAuth = {
    actor: PlaceholderName,
    permission: PlaceholderPermission,
};
export class SigningRequest {
    constructor(version, data, textEncoder, textDecoder, zlib, abiProvider, signature, scheme) {
        this.scheme = DEFAULT_SCHEME;
        if ((data.flags & abi.RequestFlagsBroadcast) !== 0 && data.req[0] === 'identity') {
            throw new Error('Invalid request (identity request cannot be broadcast)');
        }
        if ((data.flags & abi.RequestFlagsBroadcast) === 0 && data.callback.length === 0) {
            throw new Error('Invalid request (nothing to do, no broadcast or callback set)');
        }
        this.version = version;
        this.data = data;
        this.textEncoder = textEncoder;
        this.textDecoder = textDecoder;
        this.zlib = zlib;
        this.abiProvider = abiProvider;
        this.signature = signature;
        this.scheme = scheme || this.scheme;
    }
    static create(args, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const textEncoder = options.textEncoder || new TextEncoder();
            const textDecoder = options.textDecoder || new TextDecoder();
            const data = {};
            const serialize = (action) => {
                return serializeAction(action, textEncoder, textDecoder, options.abiProvider);
            };
            if (args.identity !== undefined) {
                data.req = ['identity', args.identity];
            }
            else if (args.action && !args.actions && !args.transaction) {
                data.req = ['action', yield serialize(args.action)];
            }
            else if (args.actions && !args.action && !args.transaction) {
                if (args.actions.length === 1) {
                    data.req = ['action', yield serialize(args.actions[0])];
                }
                else {
                    data.req = ['action[]', yield Promise.all(args.actions.map(serialize))];
                }
            }
            else if (args.transaction && !args.action && !args.actions) {
                const tx = args.transaction;
                if (tx.expiration === undefined) {
                    tx.expiration = '1970-01-01T00:00:00.000';
                }
                if (tx.ref_block_num === undefined) {
                    tx.ref_block_num = 0;
                }
                if (tx.ref_block_prefix === undefined) {
                    tx.ref_block_prefix = 0;
                }
                if (tx.context_free_actions === undefined) {
                    tx.context_free_actions = [];
                }
                if (tx.transaction_extensions === undefined) {
                    tx.transaction_extensions = [];
                }
                if (tx.delay_sec === undefined) {
                    tx.delay_sec = 0;
                }
                if (tx.max_cpu_usage_ms === undefined) {
                    tx.max_cpu_usage_ms = 0;
                }
                if (tx.max_net_usage_words === undefined) {
                    tx.max_net_usage_words = 0;
                }
                tx.actions = yield Promise.all(tx.actions.map(serialize));
                data.req = ['transaction', tx];
            }
            else {
                throw new TypeError('Invalid arguments: Must have exactly one of action, actions or transaction');
            }
            data.chain_id = variantId(args.chainId);
            data.flags = abi.RequestFlagsNone;
            const broadcast = args.broadcast !== undefined ? args.broadcast : true;
            if (broadcast) {
                data.flags |= abi.RequestFlagsBroadcast;
            }
            if (typeof args.callback === 'string') {
                data.callback = args.callback;
            }
            else if (typeof args.callback === 'object') {
                data.callback = args.callback.url;
                if (args.callback.background) {
                    data.flags |= abi.RequestFlagsBackground;
                }
            }
            else {
                data.callback = '';
            }
            data.info = [];
            if (typeof args.info === 'object') {
                for (const key in args.info) {
                    if (args.info.hasOwnProperty(key)) {
                        let value = args.info[key];
                        if (typeof key !== 'string') {
                            throw new Error('Invalid info dict, keys must be strings');
                        }
                        if (typeof value === 'string') {
                            value = textEncoder.encode(value);
                        }
                        data.info.push({ key, value });
                    }
                }
            }
            const req = new SigningRequest(ProtocolVersion, data, textEncoder, textDecoder, options.zlib, options.abiProvider, undefined, options.scheme);
            if (options.signatureProvider) {
                req.sign(options.signatureProvider);
            }
            return req;
        });
    }
    static identity(args, options = {}) {
        let permission = {
            actor: args.account || PlaceholderName,
            permission: args.permission || PlaceholderPermission,
        };
        if (permission.actor === PlaceholderName &&
            permission.permission === PlaceholderPermission) {
            permission = null;
        }
        return this.create({
            identity: {
                permission,
            },
            broadcast: false,
            callback: args.callback,
            info: args.info,
        }, options);
    }
    static fromTransaction(chainId, serializedTransaction, options = {}) {
        if (typeof chainId !== 'string') {
            chainId = Serialize.arrayToHex(chainId);
        }
        if (typeof serializedTransaction === 'string') {
            serializedTransaction = Serialize.hexToUint8Array(serializedTransaction);
        }
        let buf = new Serialize.SerialBuffer({
            textDecoder: options.textDecoder,
            textEncoder: options.textEncoder,
        });
        buf.push(2);
        const id = variantId(chainId);
        if (id[0] === 'chain_alias') {
            buf.push(0);
            buf.push(id[1]);
        }
        else {
            buf.push(1);
            buf.pushArray(Serialize.hexToUint8Array(id[1]));
        }
        buf.push(2);
        buf.pushArray(serializedTransaction);
        buf.push(abi.RequestFlagsBroadcast);
        buf.push(0);
        buf.push(0);
        return SigningRequest.fromData(buf.asUint8Array(), options);
    }
    static from(uri, options = {}) {
        if (typeof uri !== 'string') {
            throw new Error('Invalid request uri');
        }
        const [scheme, path] = uri.split(':');
        if (scheme !== (options.scheme || DEFAULT_SCHEME) && scheme !== `web+${(options.scheme || DEFAULT_SCHEME)}`) {
            throw new Error('Invalid scheme');
        }
        const data = base64u.decode(path.startsWith('//') ? path.slice(2) : path);
        return SigningRequest.fromData(data, options);
    }
    static fromData(data, options = {}) {
        const header = data[0];
        const version = header & ~(1 << 7);
        if (version !== ProtocolVersion) {
            throw new Error('Unsupported protocol version');
        }
        let array = data.slice(1);
        if ((header & (1 << 7)) !== 0) {
            if (!options.zlib) {
                throw new Error('Compressed URI needs zlib');
            }
            array = options.zlib.inflateRaw(array);
        }
        const textEncoder = options.textEncoder || new TextEncoder();
        const textDecoder = options.textDecoder || new TextDecoder();
        const buffer = new Serialize.SerialBuffer({
            textEncoder,
            textDecoder,
            array,
        });
        const req = SigningRequest.type.deserialize(buffer);
        let signature;
        if (buffer.haveReadData()) {
            const type = AbiTypes.get('request_signature');
            signature = type.deserialize(buffer);
        }
        return new SigningRequest(version, req, textEncoder, textDecoder, options.zlib, options.abiProvider, signature, options.scheme);
    }
    sign(signatureProvider) {
        const message = this.getSignatureDigest();
        this.signature = signatureProvider.sign(Serialize.arrayToHex(message));
    }
    getSignatureDigest() {
        const buffer = new Serialize.SerialBuffer({
            textEncoder: this.textEncoder,
            textDecoder: this.textDecoder,
        });
        buffer.pushArray([this.version, 0x72, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74]);
        buffer.pushArray(this.getData());
        return sha256(buffer.asUint8Array());
    }
    setSignature(signer, signature) {
        this.signature = { signer, signature };
    }
    setCallback(url, background) {
        this.data.callback = url;
        if (background) {
            this.data.flags |= abi.RequestFlagsBackground;
        }
        else {
            this.data.flags &= ~abi.RequestFlagsBackground;
        }
    }
    setBroadcast(broadcast) {
        if (broadcast) {
            this.data.flags |= abi.RequestFlagsBroadcast;
        }
        else {
            this.data.flags &= ~abi.RequestFlagsBroadcast;
        }
    }
    encode(compress, slashes) {
        const shouldCompress = compress !== undefined ? compress : this.zlib !== undefined;
        if (shouldCompress && this.zlib === undefined) {
            throw new Error('Need zlib to compress');
        }
        let header = this.version;
        const data = this.getData();
        const sigData = this.getSignatureData();
        let array = new Uint8Array(data.byteLength + sigData.byteLength);
        array.set(data, 0);
        array.set(sigData, data.byteLength);
        if (shouldCompress) {
            const deflated = this.zlib.deflateRaw(array);
            if (array.byteLength > deflated.byteLength) {
                header |= 1 << 7;
                array = deflated;
            }
        }
        const out = new Uint8Array(1 + array.byteLength);
        out[0] = header;
        out.set(array, 1);
        let scheme = `${this.scheme}:`;
        if (slashes !== false) {
            scheme += '//';
        }
        return scheme + base64u.encode(out);
    }
    getData() {
        const buffer = new Serialize.SerialBuffer({
            textEncoder: this.textEncoder,
            textDecoder: this.textDecoder,
        });
        SigningRequest.type.serialize(buffer, this.data);
        return buffer.asUint8Array();
    }
    getSignatureData() {
        if (!this.signature) {
            return new Uint8Array(0);
        }
        const buffer = new Serialize.SerialBuffer({
            textEncoder: this.textEncoder,
            textDecoder: this.textDecoder,
        });
        const type = AbiTypes.get('request_signature');
        type.serialize(buffer, this.signature);
        return buffer.asUint8Array();
    }
    getRequiredAbis() {
        return this.getRawActions()
            .filter((action) => !isIdentity(action))
            .map((action) => action.account)
            .filter((value, index, self) => self.indexOf(value) === index);
    }
    requiresTapos() {
        let tx = this.getRawTransaction();
        return !this.isIdentity() && !hasTapos(tx);
    }
    fetchAbis(abiProvider) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = abiProvider || this.abiProvider;
            if (!provider) {
                throw new Error('Missing ABI provider');
            }
            const abis = new Map();
            yield Promise.all(this.getRequiredAbis().map((account) => __awaiter(this, void 0, void 0, function* () {
                abis.set(account, yield provider.getAbi(account));
            })));
            return abis;
        });
    }
    resolveActions(abis, signer) {
        return this.getRawActions().map((rawAction) => {
            let contractAbi;
            if (isIdentity(rawAction)) {
                contractAbi = abi.data;
            }
            else {
                contractAbi = abis.get(rawAction.account);
            }
            if (!contractAbi) {
                throw new Error(`Missing ABI definition for ${rawAction.account}`);
            }
            const contract = getContract(contractAbi);
            if (signer) {
                contract.types.get('name').deserialize = (buffer) => {
                    const name = buffer.getName();
                    if (name === PlaceholderName) {
                        return signer.actor;
                    }
                    else if (name === PlaceholderPermission) {
                        return signer.permission;
                    }
                    else {
                        return name;
                    }
                };
            }
            const action = Serialize.deserializeAction(contract, rawAction.account, rawAction.name, rawAction.authorization, rawAction.data, this.textEncoder, this.textDecoder);
            if (signer) {
                action.authorization = action.authorization.map((auth) => {
                    let { actor, permission } = auth;
                    if (actor === PlaceholderName) {
                        actor = signer.actor;
                    }
                    if (permission === PlaceholderPermission) {
                        permission = signer.permission;
                    }
                    if (permission === PlaceholderName) {
                        permission = signer.permission;
                    }
                    return { actor, permission };
                });
            }
            return action;
        });
    }
    resolveTransaction(abis, signer, ctx = {}) {
        let tx = this.getRawTransaction();
        if (!this.isIdentity() && !hasTapos(tx)) {
            if (ctx.expiration !== undefined &&
                ctx.ref_block_num !== undefined &&
                ctx.ref_block_prefix !== undefined) {
                tx.expiration = ctx.expiration;
                tx.ref_block_num = ctx.ref_block_num;
                tx.ref_block_prefix = ctx.ref_block_prefix;
            }
            else if (ctx.block_num !== undefined &&
                ctx.ref_block_prefix !== undefined &&
                ctx.timestamp !== undefined) {
                const header = Serialize.transactionHeader(ctx, ctx.expire_seconds !== undefined ? ctx.expire_seconds : 60);
                tx.expiration = header.expiration;
                tx.ref_block_num = header.ref_block_num;
                tx.ref_block_prefix = header.ref_block_prefix;
            }
            else {
                throw new Error('Invalid transaction context, need either a reference block or explicit TAPoS values');
            }
        }
        const actions = this.resolveActions(abis, signer);
        return Object.assign(Object.assign({}, tx), { actions });
    }
    resolve(abis, signer, ctx = {}) {
        const transaction = this.resolveTransaction(abis, signer, ctx);
        const buf = new Serialize.SerialBuffer({
            textDecoder: this.textDecoder,
            textEncoder: this.textEncoder,
        });
        const actions = transaction.actions.map((action) => {
            let contractAbi;
            if (isIdentity(action)) {
                contractAbi = abi.data;
            }
            else {
                contractAbi = abis.get(action.account);
            }
            if (!contractAbi) {
                throw new Error(`Missing ABI definition for ${action.account}`);
            }
            const contract = getContract(contractAbi);
            const { textDecoder, textEncoder } = this;
            return Serialize.serializeAction(contract, action.account, action.name, action.authorization, action.data, textEncoder, textDecoder);
        });
        SigningRequest.transactionType.serialize(buf, Object.assign(Object.assign({}, transaction), { actions }));
        const serializedTransaction = buf.asUint8Array();
        return new ResolvedSigningRequest(this, signer, transaction, serializedTransaction);
    }
    getScheme() {
        return this.scheme;
    }
    getChainId() {
        const id = this.data.chain_id;
        switch (id[0]) {
            case 'chain_id':
                return id[1];
            case 'chain_alias':
                if (ChainIdLookup.has(id[1])) {
                    return ChainIdLookup.get(id[1]);
                }
                else {
                    throw new Error('Unknown chain id alias');
                }
            default:
                throw new Error('Invalid signing request data');
        }
    }
    getRawActions() {
        const req = this.data.req;
        switch (req[0]) {
            case 'action':
                return [req[1]];
            case 'action[]':
                return req[1];
            case 'identity':
                let data = '0101000000000000000200000000000000';
                let authorization = [PlaceholderAuth];
                if (req[1].permission) {
                    let buf = new Serialize.SerialBuffer({
                        textDecoder: this.textDecoder,
                        textEncoder: this.textEncoder,
                    });
                    SigningRequest.idType.serialize(buf, req[1]);
                    data = Serialize.arrayToHex(buf.asUint8Array());
                    authorization = [req[1].permission];
                }
                return [
                    {
                        account: '',
                        name: 'identity',
                        authorization,
                        data,
                    },
                ];
            case 'transaction':
                return req[1].actions;
            default:
                throw new Error('Invalid signing request data');
        }
    }
    getRawTransaction() {
        const req = this.data.req;
        switch (req[0]) {
            case 'transaction':
                return req[1];
            case 'action':
            case 'action[]':
            case 'identity':
                return {
                    actions: this.getRawActions(),
                    context_free_actions: [],
                    transaction_extensions: [],
                    expiration: '1970-01-01T00:00:00.000',
                    ref_block_num: 0,
                    ref_block_prefix: 0,
                    max_cpu_usage_ms: 0,
                    max_net_usage_words: 0,
                    delay_sec: 0,
                };
            default:
                throw new Error('Invalid signing request data');
        }
    }
    isIdentity() {
        return this.data.req[0] === 'identity';
    }
    shouldBroadcast() {
        if (this.isIdentity()) {
            return false;
        }
        return (this.data.flags & abi.RequestFlagsBroadcast) !== 0;
    }
    getIdentity() {
        if (this.data.req[0] === 'identity' && this.data.req[1].permission) {
            const { actor } = this.data.req[1].permission;
            return actor === PlaceholderName ? null : actor;
        }
        return null;
    }
    getIdentityPermission() {
        if (this.data.req[0] === 'identity' && this.data.req[1].permission) {
            const { permission } = this.data.req[1].permission;
            return permission === PlaceholderName ? null : permission;
        }
        return null;
    }
    getRawInfo() {
        let rv = {};
        for (const { key, value } of this.data.info) {
            rv[key] = typeof value === 'string' ? Serialize.hexToUint8Array(value) : value;
        }
        return rv;
    }
    getInfo() {
        let rv = {};
        let raw = this.getRawInfo();
        for (const key of Object.keys(raw)) {
            rv[key] = this.textDecoder.decode(raw[key]);
        }
        return rv;
    }
    setInfoKey(key, value) {
        let pair = this.data.info.find((pair) => {
            return pair.key === key;
        });
        let encodedValue;
        switch (typeof value) {
            case 'string':
                encodedValue = this.textEncoder.encode(value);
                break;
            case 'boolean':
                encodedValue = new Uint8Array([value ? 1 : 0]);
                break;
            default:
                throw new TypeError('Invalid value type, expected string or boolean.');
        }
        if (!pair) {
            pair = { key, value: encodedValue };
            this.data.info.push(pair);
        }
        else {
            pair.value = encodedValue;
        }
    }
    clone() {
        let signature;
        if (this.signature) {
            signature = JSON.parse(JSON.stringify(this.signature));
        }
        const data = JSON.stringify(this.data, (key, value) => {
            if (value instanceof Uint8Array) {
                return Array.from(value);
            }
            return value;
        });
        return new SigningRequest(this.version, JSON.parse(data), this.textEncoder, this.textDecoder, this.zlib, this.abiProvider, signature, this.scheme);
    }
    toString() {
        return this.encode();
    }
    toJSON() {
        return this.encode();
    }
}
SigningRequest.type = AbiTypes.get('signing_request');
SigningRequest.idType = AbiTypes.get('identity');
SigningRequest.transactionType = AbiTypes.get('transaction');
export class ResolvedSigningRequest {
    constructor(request, signer, transaction, serializedTransaction) {
        this.request = request;
        this.signer = signer;
        this.transaction = transaction;
        this.serializedTransaction = serializedTransaction;
    }
    static fromPayload(payload, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = SigningRequest.from(payload.req, options);
            const abis = yield request.fetchAbis();
            return request.resolve(abis, { actor: payload.sa, permission: payload.sp }, {
                ref_block_num: Number(payload.rbn),
                ref_block_prefix: Number(payload.rid),
                expiration: payload.ex,
            });
        });
    }
    getTransactionId() {
        return Serialize.arrayToHex(sha256(this.serializedTransaction));
    }
    getCallback(signatures, blockNum) {
        const { callback, flags } = this.request.data;
        if (!callback || callback.length === 0) {
            return null;
        }
        if (!signatures || signatures.length === 0) {
            throw new Error('Must have at least one signature to resolve callback');
        }
        const payload = {
            sig: signatures[0],
            tx: this.getTransactionId(),
            rbn: String(this.transaction.ref_block_num),
            rid: String(this.transaction.ref_block_prefix),
            ex: this.transaction.expiration,
            req: this.request.encode(),
            sa: this.signer.actor,
            sp: this.signer.permission,
        };
        for (const [n, sig] of signatures.slice(1).entries()) {
            payload[`sig${n}`] = sig;
        }
        if (blockNum) {
            payload.bn = String(blockNum);
        }
        const url = callback.replace(/({{([a-z0-9]+)}})/g, (_1, _2, m) => {
            return payload[m] || '';
        });
        return {
            background: (flags & abi.RequestFlagsBackground) !== 0,
            payload,
            url,
        };
    }
}
function getContract(contractAbi) {
    const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), contractAbi);
    const actions = new Map();
    for (const { name, type } of contractAbi.actions) {
        actions.set(name, Serialize.getType(types, type));
    }
    return { types, actions };
}
function serializeAction(action, textEncoder, textDecoder, abiProvider) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof action.data === 'string') {
            return action;
        }
        let contractAbi;
        if (isIdentity(action)) {
            contractAbi = abi.data;
        }
        else if (abiProvider) {
            contractAbi = yield abiProvider.getAbi(action.account);
        }
        else {
            throw new Error('Missing abi provider');
        }
        const contract = getContract(contractAbi);
        return Serialize.serializeAction(contract, action.account, action.name, action.authorization, action.data, textEncoder, textDecoder);
    });
}
function variantId(chainId) {
    if (!chainId) {
        chainId = ChainName.EOS;
    }
    if (typeof chainId === 'number') {
        return ['chain_alias', chainId];
    }
    else {
        const name = idToName(chainId);
        if (name !== ChainName.UNKNOWN) {
            return ['chain_alias', name];
        }
        return ['chain_id', chainId];
    }
}
function isIdentity(action) {
    return action.account === '' && action.name === 'identity';
}
function hasTapos(tx) {
    return !(tx.expiration === '1970-01-01T00:00:00.000' &&
        tx.ref_block_num === 0 &&
        tx.ref_block_prefix === 0);
}
export function idToName(chainId) {
    chainId = chainId.toLowerCase();
    for (const [n, id] of ChainIdLookup) {
        if (id === chainId) {
            n;
        }
    }
    return ChainName.UNKNOWN;
}
export function nameToId(chainName) {
    return (ChainIdLookup.get(chainName) ||
        '0000000000000000000000000000000000000000000000000000000000000000');
}
//# sourceMappingURL=signing-request.js.map
// Generated by eosio-abi2ts 1.2.2 - eosio::abi/1.1

export type Name = string
export type Bytes = string | number[] | Uint8Array
export type PublicKey = string
export type TimePointSec = string
export type Uint32 = number
export type Uint64 = number | string

export interface SealedMessage {
    from: PublicKey
    nonce: Uint64
    ciphertext: Bytes
    checksum: Uint32
}

export interface LinkCreate {
    session_name: Name
    request_key: PublicKey
}

export interface LinkInfo {
    expiration: TimePointSec
}
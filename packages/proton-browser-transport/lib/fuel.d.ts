import { LinkSession } from 'anchor-link';
import { SigningRequest } from 'eosio-signing-request';
export declare function fuel(request: SigningRequest, session: LinkSession, updatePrepareStatus: (message: string) => void): Promise<SigningRequest>;

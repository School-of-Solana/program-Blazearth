import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import type { SocialApp } from '../idl/social_app';
import { IDL } from '../idl/idl';

export const PROGRAM_ID = new PublicKey('6t5PjEe4SW7JbtHxbttwZ9gyGGmLhahA9r2v2E3iPTsZ');
export const NETWORK = 'https://api.devnet.solana.com';

export function getProgram(provider: AnchorProvider): Program<SocialApp> {
    return new Program(IDL, provider);
}

export function getConnection(): Connection {
    return new Connection(NETWORK, 'confirmed');
}

export function getProfilePDA(userPubkey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), userPubkey.toBuffer()],
        PROGRAM_ID
    );
}

export function getPostPDA(userPubkey: PublicKey, postIndex: number): [PublicKey, number] {
    const indexBuffer = Buffer.alloc(8);
    indexBuffer.writeBigUInt64LE(BigInt(postIndex));

    return PublicKey.findProgramAddressSync(
        [Buffer.from('post'), userPubkey.toBuffer(), indexBuffer],
        PROGRAM_ID
    );
}

export function getCommentPDA(postPubkey: PublicKey, commentIndex: number): [PublicKey, number] {
    const indexBuffer = Buffer.alloc(8);
    indexBuffer.writeBigUInt64LE(BigInt(commentIndex));

    return PublicKey.findProgramAddressSync(
        [Buffer.from('comment'), postPubkey.toBuffer(), indexBuffer],
        PROGRAM_ID
    );
}

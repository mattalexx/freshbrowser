import getStream = require('get-stream')
import assert from 'assert'
import {mkdtemp} from 'fs/promises'
import {tmpdir} from 'os'
import type {Readable} from 'stream'
import {PassThrough, Stream} from 'stream'
import type {ChildProcess} from 'child_process'
import {once} from 'events'
import {dirname, join} from 'path'
import {ExitStatus} from 'typescript'

export const rootDir: string = dirname(require.resolve('../../package.json'))

export type ChildClosedOptions = getStream.OptionsWithEncoding & {serialization?: false | 'json'; timeout?: number};

export interface ChildClosedPayload {
    stdout: string
    stderr: string
    response?: unknown
}

class TimeoutError extends Error {
    constructor(delay: number) {
        super(`timeout exceeded (${delay} ms)`)
        this.name = 'TimeoutError'
    }
}

export function promiseWithTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
    let id: ReturnType<typeof setTimeout>
    return Promise.race<T>([promise, new Promise<never>((_, reject) => {
        id = setTimeout(() => reject(new TimeoutError(ms)), ms)
    })]).finally(() => clearTimeout(id))
}

/**
 * Returns a promise that resolves with a child process's close event
 * Also handles character set decoding, deserialization from JSON, accepts a timeout in ms
 *
 * @example
 * const child = fork('./script.js');
 * const {stdout, stderr, response} = await watchChild(child);
 * const {exitCode} = child;
 */
export async function childClosed(child: ChildProcess, options?: ChildClosedOptions): Promise<ChildClosedPayload> {
    const deserialize = (output: string) => {
        return options?.serialization === 'json' ? JSON.parse(output) : output
    }
    const collect = (readable: Readable) => {
        return getStream(readable || new PassThrough(), options)
    }
    assert(child.stdout && child.stderr, 'Null stream(s)')
    const childPromises = Promise.all([once(child, 'close'), collect(child.stdout), collect(child.stderr)]).then(([, stdout, stderr]) => {
        return ({stdout, stderr, response: deserialize(stdout)})
    })
    if (options?.timeout) {
        return promiseWithTimeout(options.timeout, childPromises)
    }
    return childPromises
}

export async function expectSuccess(child: ChildProcess): Promise<ChildClosedPayload> {
    const payload = await childClosed(child)
    expect(child.exitCode).toBe(ExitStatus.Success)
    return payload
}

export async function forkOpts() {
    return {
        silent: true,
        cwd: await mkdtemp(join(tmpdir(), 'darkreader')),
    }
}

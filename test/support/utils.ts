import getStream from 'get-stream'
import {PassThrough} from 'stream'
import type {ChildProcess} from 'child_process'
import {once} from 'events'
import {dirname} from 'path'

export const rootDir: string = dirname(require.resolve('../../package.json'))

export interface ChildCloseOptions {
    timeout?: number
    stdout?: getStream.OptionsWithEncoding & {
        serialize: 'json' | false
    },
    stderr?: getStream.OptionsWithEncoding,
}

export interface ChildClosedPayload {
    stdout: string | unknown
    stderr: string
}

class TimeoutError extends Error {
    constructor(delay: number) {
        super(`timeout exceeded (${delay} ms)`)
        this.name = 'TimeoutError'
    }
}

export function promiseWithTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>
    const theClock: Promise<never> = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new TimeoutError(ms)), ms)
    })
    const racers = [promise, theClock]
    return Promise.race(racers).finally(() => clearTimeout(timeoutId))
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
export async function childClosed(child: ChildProcess, options?: ChildCloseOptions): Promise<ChildClosedPayload> {
    const childPromises = Promise.all([
        // Promise to close the child process
        once(child, 'close'),
        // Promise to collect stdout
        getStream(child.stdout || new PassThrough(), options?.stdout || {}).then(stdout => {
            return options?.stdout?.serialize === 'json' ? JSON.parse(stdout) : stdout
        }),
        // Promise to collect stderr
        getStream(child.stderr || new PassThrough(), options?.stderr || {}),
    ]).then(([, stdout, stderr]) => ({stdout, stderr}))
    if (options?.timeout) {
        return promiseWithTimeout(options.timeout, childPromises)
    }
    return childPromises
}

export function replacePaths(raw: string): string {
    return raw.split(rootDir).join('<PROJECT_DIR>')
}

import {existsSync} from 'graceful-fs'
import {dirname, join} from 'path'

// https://stackoverflow.com/questions/64961387/how-to-use-import-meta-when-testing-with-jest
export const rootDir = findRootDirectory()

/**
 * @fixme This should be figured out some other way
 */
export function findRootDirectory(): string {

    let dir: string = process.cwd(), lastDir: string | null = null

    while (dir != lastDir) {
        if (existsSync(join(dir, 'src')) && existsSync(join(dir, 'test'))) {
            return dir
        }
        lastDir = dir
        dir = dirname(dir)
    }

    // try {
    //     // eslint-disable-next-line
    //     // @ts-ignore
    //     const url = import.meta.url
    //     return dirname(fileURLToPath(new URL('../package.json', url)))
    // } catch (e) {
    //     console.log(`Not able to find root directory using import.meta.url: ${e}`)
    // }

    throw new Error('unable to find root directory')
}

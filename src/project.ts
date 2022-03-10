import {URL, fileURLToPath} from 'url'
import {dirname} from 'path'

export const rootDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))

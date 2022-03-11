import path, {dirname} from 'path'
import {findRootDirectory} from '../src/project'

describe('findRootDirectory', () => {

    // Does not work in Jest execution with Babel
    const rootDir = path.resolve(module.path, '..')

    it('should provide root directory', () => {
        const got = findRootDirectory()
        expect(rootDir).toBe(rootDir)
    })
})

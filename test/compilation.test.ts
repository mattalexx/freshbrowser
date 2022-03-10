import ts from 'typescript'
import {dirname, join} from 'path'
import {fork} from 'child_process'
import {ParsedCommandLine} from 'typescript/lib/tsserverlibrary'
import {expectSuccess, forkOpts} from './support/utils'

const rootDir = dirname(require.resolve('../../package.json'))
const tsc = require.resolve('typescript/bin/tsc')

let tsProjects: Array<{ tsconfig: string }> = [
    // Scripts
    {tsconfig: 'src'},
    // Source
    {tsconfig: 'src/api'},
    // Tests
    {tsconfig: 'tests/browser'},
]

describe('TypeScript project config', () => {
    it.each(tsProjects)('file should parse and resolve correctly: $tsconfig', async ({tsconfig}) => {
        const project = join(rootDir, tsconfig, 'tsconfig.json')

        // Fire
        const {response} = await expectSuccess(fork(tsc, ['--project', project, '--showConfig']))

        // Parse into ParsedCommandLine object
        const config: ParsedCommandLine = ts.parseJsonConfigFileContent(response, ts.sys, project)
        expect(config.raw).toMatchSnapshot()
    })

    it.each(tsProjects)('should compile and build without errors: $tsconfig', async ({tsconfig}) => {
        const project = join(rootDir, tsconfig, 'tsconfig.json')

        // Fire (compile)
        await expectSuccess(fork(tsc, ['--project', project, '--noEmit'], await forkOpts()))
    }, 100000)

    it.each(tsProjects)('should compile and build without errors: $tsconfig', async ({tsconfig}) => {
        const project = join(rootDir, tsconfig, 'tsconfig.json')

        // Fire (build)
        await expectSuccess(fork(tsc, ['--build', project], await forkOpts()))
    }, 100000)

    it('the root project should build without errors: ./tsconfig.json', async () => {
        const project = join(rootDir, 'tsconfig.json')

        // Fire: (build from root)
        await expectSuccess(fork(tsc, ['--build', project], await forkOpts()))
    })
})

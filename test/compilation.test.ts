import {fork} from 'child_process'
import {mkdtemp} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import ts, {ExitStatus} from 'typescript'
import {ParsedCommandLine} from 'typescript/lib/tsserverlibrary'
import {childClosed, ChildClosedPayload, ChildCloseOptions, replacePaths, rootDir} from './support/utils'

interface TestCase {
    tsconfig: string
}

const tscExe = join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc')

const TIMEOUT = 10000

const tsProjects: Array<TestCase> = [
    // Scripts
    {tsconfig: 'scripts'},
    // Source
    {tsconfig: 'src'},
    // Tests
    {tsconfig: 'test'},
]

describe('TypeScript project config', () => {
    it.each(tsProjects)('file should parse and resolve correctly: $tsconfig', async ({tsconfig}) => {
        const {stdout} = await tsc(['--project', abs(tsconfig), '--showConfig'])
        const stdoutNomalized = replacePaths(stdout as string)
        const json = JSON.parse(stdoutNomalized)
        const config: ParsedCommandLine = ts.parseJsonConfigFileContent(json, ts.sys, abs(tsconfig))
        expect(config.raw).toMatchSnapshot()
    })

    it.each(tsProjects as TestCase[])('should compile and build without errors: $tsconfig', async ({tsconfig}) => {
        await tsc(['--project', abs(tsconfig), '--noEmit'])
    }, TIMEOUT)

    it.each(tsProjects)('should compile and build without errors: $tsconfig', async ({tsconfig}) => {
        await tsc(['--build', abs(tsconfig)])
    }, TIMEOUT)

    it('the root project should build without errors: ./tsconfig.json', async () => {
        await tsc(['--build', rootDir])
    }, TIMEOUT)
})

async function tsc(cmdArgs: string[], closeOpts?: ChildCloseOptions): Promise<ChildClosedPayload> {
    const tmp: Promise<string> = mkdtemp(join(tmpdir(), 'darkreader'))
    const forkOpts = {silent: true, ourCwd: tmp}
    const child = fork(tscExe, cmdArgs, forkOpts)
    const payload = await childClosed(child, closeOpts)
    const error = child.exitCode === 0 ? undefined : payload.stdout;
    expect(error).toBeUndefined()
    expect(child.exitCode).toBe(ExitStatus.Success)
    return payload
}

function abs(relPath: string) {
    return join(rootDir, relPath, 'tsconfig.json')
}

import {existsSync} from 'graceful-fs'
import {join} from 'node:path'
import {dirSync as tmpDirSync} from 'tmp'
import {downloadAndUnpackExtension, downloadCrxFile} from '../src/extension'

describe('extension.ts', () => {
    describe('downloadCrxFile', () => {
        it('should download a CRX file', async () => {
            const testHash = 'idhfcdbheobinplaamokffboaccidbal'
            const tmpobj = tmpDirSync()

            const crxFile = join(tmpobj.name, testHash + '.crx')
            await downloadCrxFile(testHash, crxFile)
            expect(existsSync(crxFile)).toBeTruthy()
        })
    })

    describe('downloadAndUnpackExtension', () => {
        it('should download and unpack a CRX file', async () => {
            const testHash = 'idhfcdbheobinplaamokffboaccidbal'
            const tmpobj = tmpDirSync()

            const got = await downloadAndUnpackExtension(testHash, tmpobj.name)

            const wantDir = join(tmpobj.name, testHash)
            expect(got).toBe(wantDir)
            expect(existsSync(wantDir)).toBeTruthy()
            expect(existsSync(join(wantDir, 'manifest.json'))).toBeTruthy()
        })

        it('should return a temporary directory if one is not provided', async () => {
            const testHash = 'idhfcdbheobinplaamokffboaccidbal'

            const got = await downloadAndUnpackExtension(testHash)

            expect(got).toBeTruthy()
            expect(existsSync(got)).toBeTruthy()
            expect(existsSync(join(got, 'manifest.json'))).toBeTruthy()
        })
    })
})

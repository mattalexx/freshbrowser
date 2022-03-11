import {FollowResponse, https} from 'follow-redirects'
import {createWriteStream, existsSync, PathLike} from 'graceful-fs'
import {IncomingMessage} from 'http'
import {join} from 'path'
import {dirSync as tmpDirSync} from 'tmp'
import {URL, URLSearchParams} from 'url'
import {format} from 'util'
import unzip from 'unzip-crx-3'

export async function downloadAndUnpackExtension(extensionHash: string, outputDir?: string): Promise<string> {
    const outputDirUsed = outputDir || tmpDirSync().name
    const extensionDir = join(outputDirUsed, extensionHash)
    const crxFile = `${extensionDir}.crx`

    // We'll consider this a cache hit
    if (existsSync(extensionDir)) {
        return Promise.resolve(extensionDir)
    }

    await downloadCrxFile(extensionHash, crxFile)
    await unzip(crxFile, extensionDir)

    return Promise.resolve(extensionDir)
}

export async function downloadCrxFile(extensionHash: string, crxFile: string): Promise<void> {
    const url = new URL(`https://clients2.google.com/service/update2/crx?${(new URLSearchParams({
        response: 'redirect',
        acceptformat: 'crx2,crx3',
        x: new URLSearchParams({id: extensionHash, uc: ''}).toString(),
        prodversion: '32'
    }))}`)

    return new Promise((resolve, reject) => {
        https.get(url, (res: IncomingMessage & FollowResponse) => {
            res.on('end', resolve)
            res.on('error', reject)
            res.pipe(createWriteStream(crxFile))
        }).end()
    })
}

export function assertValidUnpackedExtension(dir: PathLike) {
    const manifest: PathLike = join(dir as string, 'manifest.json')
    if (!existsSync(manifest)) {
        throw new Error(format('Invalid extension directory -- manifest.json not found at %s', manifest))
    }
}

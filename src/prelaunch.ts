import {readFileSync, writeFileSync, existsSync, mkdirSync, PathLike, rmSync} from 'graceful-fs'
import {dirname, join} from 'path'
import {Page} from 'puppeteer'
import PuppeteerNode from 'puppeteer/lib/cjs/puppeteer/node'
import type {PuppeteerNodeLaunchOptions} from 'puppeteer/lib/cjs/puppeteer/node/LaunchOptions'
import tmp from 'tmp'
import {ChromeExtension} from './data'
import {assertValidUnpackedExtension, downloadAndUnpackExtension} from './extension'

type RawUserPrefValue = string | boolean | number | object

export declare class PrelaunchOptions {
    verbose?: boolean
    debuggerPort?: number
    dark?: boolean
    showDefaultBrowserCheck?: boolean
    showAutomationBanner?: boolean
    showChromeLabsBeaker?: boolean
    removeInitialPages?: boolean
    extensions?: PathLike[]
    devtoolsOpts?: {
        autoOpen?: boolean
        position?: 'bottom' | 'top' | 'left' | 'right' | undefined
        size?: number | undefined
        initialTab?: string // 'console' | '...' // TODO
        custom?: Record<string, RawUserPrefValue>
    }
}

export declare class ChromiumUserPrefs {
    devtools?: { preferences?: Record<string, string> }
}

export async function puppeteerLaunch(opts?: PuppeteerNodeLaunchOptions, prelaunch?: PrelaunchOptions) {
    opts = {timeout: 0, ...opts}
    prelaunch = prelaunch || {}

    await transformPuppLaunchOptions(opts, prelaunch)
    await prepareChromeUserDir(opts, prelaunch)
    const browserInstance = await PuppeteerNode.launch(opts)

    // Close startup page
    if (prelaunch.removeInitialPages) {
        const allPages = await browserInstance.pages()
        await Promise.all(allPages.map((p) => p.close()))
        const browserWSEndpoint = browserInstance.wsEndpoint()
        process.send?.({browserWSEndpoint})
    }

    // Kill process when browser quits
    // eslint-disable-next-line no-process-exit
    browserInstance.on('disconnected', () => {
        // eslint-disable-next-line no-process-exit
        process.exit()
    })

    return browserInstance
}

export async function transformPuppLaunchOptions(opts: PuppeteerNodeLaunchOptions, prelaunch: PrelaunchOptions) {
    opts.args = opts.args || []
    opts.ignoreDefaultArgs = opts.ignoreDefaultArgs || []
    opts.env = opts.env || process.env
    prelaunch.extensions = prelaunch.extensions || []

    // Don't pop up "Chrome is not your default browser"
    if (prelaunch.showDefaultBrowserCheck === false) {
        opts.args.push('--no-default-browser-check')
    }

    if (typeof opts.ignoreDefaultArgs !== 'boolean') {

        // Don't pop up "Chrome is being controlled by automated software"
        if (prelaunch.showAutomationBanner === false) {
            opts.ignoreDefaultArgs.push('--enable-automation')
        }

        // Unsupported flag that pops up a warning
        // if (prelaunch.showAutomationBanner === false) {
        opts.ignoreDefaultArgs.push('--enable-blink-features=IdleDetection')
        // }
    }

    // Remove little beaker icon next to URL bar
    if (prelaunch.showChromeLabsBeaker === false) {
        opts.args.push('--disable-features=ChromeLabs')
    }

    // Dark mode
    if (prelaunch.dark) {
        // opts.colorScheme = 'dark';  // Playwright
        prelaunch.extensions.push(await downloadAndUnpackExtension(ChromeExtension.JUST_BLACK))
        opts.args.push('--enable-features=WebUIDarkMode', '--force-dark-mode')
    }

    // Verbose/debug logging
    if (prelaunch.verbose) {
        opts.env['PWDEBUG'] = 'console' // Not headless; disable timeout; open inspector for test runner
        opts.env['DEBUG'] = 'pw:api'    // Verbose logging
    }

    // Debugger port
    if (prelaunch.debuggerPort) {
        opts.args.push(`--remote-debugging-port=${prelaunch.debuggerPort}`)
        // opts.useWebSocket = true; // Playwright only
    }

    // Extensions
    if (prelaunch.extensions.length) {
        for (const extension of prelaunch.extensions) {
            assertValidUnpackedExtension(extension)
        }
        opts.args.push(
            `--disable-extensions-except=${prelaunch.extensions.join(',')}`,
            `--load-extension=${prelaunch.extensions.join(',')}`,
            '--show-component-extension-result',
        )
    }

    return opts
}

export async function prepareChromeUserDir(opts: PuppeteerNodeLaunchOptions, prelaunch: PrelaunchOptions) {
    // If dir is not being set manually, generate a unique path
    const tmpobj = tmp.dirSync()
    if (!opts.userDataDir) {
        opts.userDataDir = join(tmpobj.name, '_profile')
    }

    const prefsPath = join(opts.userDataDir, 'Default', 'Preferences')
    let userPrefs: ChromiumUserPrefs = {}

    // If dir does not exist or is corrupt, recreate it
    if (!existsSync(prefsPath)) {
        rmSync(opts.userDataDir, {recursive: true, force: true})
        mkdirSync(opts.userDataDir, {recursive: true})
    } else {
        userPrefs = JSON.parse(readFileSync(prefsPath, {encoding: 'utf-8'})) || {}
    }

    if (prelaunch.devtoolsOpts && Object.keys(prelaunch.devtoolsOpts)) {
        transformChromiumUserPrefs(userPrefs, prelaunch)
        mkdirSync(dirname(prefsPath), {recursive: true})
        writeFileSync(prefsPath, JSON.stringify(userPrefs))
    }
}

export function transformChromiumUserPrefs(prefs: ChromiumUserPrefs, prelaunch: PrelaunchOptions) {
    // Apply devtools config
    if (prelaunch?.devtoolsOpts) {
        const devPrefs: Record<string, string> = {}
        if (prelaunch.devtoolsOpts?.initialTab) {
            devPrefs['panel-selectedTab'] = JSON.stringify(prelaunch.devtoolsOpts.initialTab)
        }
        if (prelaunch.devtoolsOpts?.position) {
            devPrefs['currentDockState'] = JSON.stringify(prelaunch.devtoolsOpts.position)
        }
        if (prelaunch.devtoolsOpts?.size) {
            const size = prelaunch.devtoolsOpts?.size
            devPrefs['InspectorView.splitViewState'] = JSON.stringify({horizontal: {size}, vertical: {size}})
        }
        if (prelaunch.devtoolsOpts?.custom) {
            for (const [key, value] of Object.entries(prelaunch.devtoolsOpts.custom)) {
                devPrefs[key] = JSON.stringify(value)
            }
        }
        prefs.devtools = {...prefs.devtools}
        prefs.devtools.preferences = {...prefs.devtools.preferences, ...devPrefs}
    }
}

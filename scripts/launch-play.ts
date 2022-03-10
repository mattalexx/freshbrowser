import {ChromeExtension} from '../src/data'
import {downloadAndUnpackExtension} from '../src/extension'
import {puppeteerLaunch} from '../src/prelaunch'

(async () => {
    const darkReader: string = await downloadAndUnpackExtension(ChromeExtension.DARK_READER)
    const violentMonkey: string = await downloadAndUnpackExtension(ChromeExtension.VIOLENTMONKEY)

    const browser = await puppeteerLaunch({
        headless: true,
        devtools: true,
    }, {
        verbose: true,
        extensions: [
            darkReader,
            violentMonkey,
        ],
        showAutomationBanner: false,
        showChromeLabsBeaker: false,
        dark: true,
        debuggerPort: 555, removeInitialPages: true,
        devtoolsOpts: {
            position: 'bottom',
            size: 400,
            initialTab: 'console',
            autoOpen: true,
            custom: {
                customString: 'stringValue',
                customBoolean: true,
                customObject: {foo: 'bar'},
                customArray: ['foo', 123, 'bar'],
                customNumber: 123,
            }
        },
    })

    const page = await browser.newPage()
    await page.goto('https://www.google.com/', {
        waitUntil: 'load',
        timeout: 0,
    })
})()

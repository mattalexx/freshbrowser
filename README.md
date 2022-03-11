# Freshbrowser

This tool wraps around puppeteer and allows me request and immediately receive a fresh new browser profile. Usually I want to test some claim I'm making in a bug report. But there are also other uses, like web scraping.

The configuration properties have been changed to cater to my own list of preferences. Things are turned on and off depending on how I'm using the profile, or how pristine the testing needs to be.

## Features

- Pass it some Chrome Web Store IDs and those extensions will be installed when the browser starts
- Load unpacked extensions by passing directory paths
- Dev Tools open by default, docked at the edge of your choice, displaying the Console tab by default.
- No timeout.
- Pass a port, get a debugger session.
- Dark mode, when the browser first starts. (the websites too, and Dev Tools, not just the top of the tab bar)
- Disable minor UI elements that are meaningless to me personally, like the "this is an automated browser" message, the little beaker icon, the tab menu, the startup tab, etc

### Perhaps coming soon

- Hardening of the skill it supposedly already has
- Preloaded auth cookies
- Migration of browser history (which I use as bookmarks) between the browsers I use personally.
- Better integration with profile sync daemon.
- Port to Playwright, get Webkit.



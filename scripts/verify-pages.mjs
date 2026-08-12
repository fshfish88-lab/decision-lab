import { readFile } from 'node:fs/promises'

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
const rootRelativeAsset = /(?:src|href)=["']\/(?:assets|brand)\//

if (rootRelativeAsset.test(html)) {
  throw new Error('dist/index.html contains a root-relative asset path that will break on GitHub Pages.')
}

if (!html.includes('./brand/decision-lab-mark.svg')) {
  throw new Error('The GitHub Pages build is missing the relative brand favicon path.')
}

if (!html.includes('./assets/')) {
  throw new Error('The GitHub Pages build is missing relative bundled asset paths.')
}

console.log('GitHub Pages asset paths verified.')

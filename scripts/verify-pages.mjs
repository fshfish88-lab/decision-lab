import { readFile } from 'node:fs/promises'

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
const subpathAsset = /(?:src|href)=["'](?:\.\/|\/decision-lab\/)(?:assets|brand)\//

if (subpathAsset.test(html)) {
  throw new Error('dist/index.html still contains relative or /decision-lab/ asset paths.')
}

if (!html.includes('/brand/decision-lab-mark.svg')) {
  throw new Error('The production build is missing the root-relative brand favicon path.')
}

if (!html.includes('/assets/')) {
  throw new Error('The production build is missing root-relative bundled asset paths.')
}

if (html.includes('/decision-lab/')) {
  throw new Error('dist/index.html still depends on the legacy /decision-lab/ subpath.')
}

console.log('Root-domain production asset paths verified.')

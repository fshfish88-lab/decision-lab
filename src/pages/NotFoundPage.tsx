import { Link } from 'react-router-dom'
import { usePlatform } from '../platform/PlatformContext'

export function NotFoundPage(): React.JSX.Element {
  const platform = usePlatform()
  if (platform === 'app') {
    return <main className="mobile-empty-state"><span>ERROR / 404</span><h1>这个页面不存在</h1><p>没有找到对应功能，已有决定和记录不会受到影响。</p><Link to="/">返回决策首页</Link></main>
  }
  return <main className="empty-state"><span className="section-index">ERROR / 404</span><h1>这个选择不存在</h1><p>系统检查了两遍，还是没有找到你要的页面。</p><Link className="secondary-action" to="/">返回首页</Link></main>
}

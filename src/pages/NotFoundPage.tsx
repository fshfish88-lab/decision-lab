import { Link } from 'react-router-dom'

export function NotFoundPage(): React.JSX.Element {
  return <main className="empty-state"><span className="section-index">ERROR / 404</span><h1>这个选择不存在</h1><p>系统检查了两遍，还是没有找到你要的页面。</p><Link className="secondary-action" to="/">返回首页</Link></main>
}

import { BarChart3, Database, Dices, Orbit } from 'lucide-react'

export function AboutPage(): React.JSX.Element {
  return (
    <main className="about-page">
      <header className="page-heading"><span className="section-index">ABOUT THE SYSTEM</span><h1>我们负责计算，<br />你负责停止纠结。</h1><p>DECISION LAB 是一个拥有明确人格的生活选择工具。第一版完全在浏览器中运行。</p></header>
      <section className="about-grid">
        <article><span className="about-icon about-icon--random"><Dices /></span><small>01 / RANDOM</small><h2>随机模式</h2><p>对每个有效候选项执行等概率抽取。没有暗箱，也没有系统偏爱。</p></article>
        <article><span className="about-icon about-icon--scientific"><BarChart3 /></span><small>02 / SCIENCE</small><h2>科学模式</h2><p>通过自定义指标、权重和 1～10 分评分，计算完整加权排名。</p></article>
        <article><span className="about-icon about-icon--mystic"><Orbit /></span><small>03 / MYSTIC</small><h2>玄学模式</h2><p>用本地模板和虚构指标认真胡说。娱乐性质会始终明确标注。</p></article>
        <article><span className="about-icon about-icon--data"><Database /></span><small>PRIVACY / LOCAL</small><h2>只存本机</h2><p>历史记录使用 LocalStorage 保存。V1 没有账号、数据库或后端上传。</p></article>
      </section>
    </main>
  )
}
